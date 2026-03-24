import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { OrderClaim, PayoutStatus, ReviewStatus } from '../../models/OrderClaim';
import { Campaign } from '../../models/Campaign';
import { BuyerProfile } from '../../models/BuyerProfile';
import { User } from '../../models/User';
import { logger, formatError } from '../../utils/logger';
import { logAdminAction } from '../../utils/auditLog';
import { ADMIN_ACTIONS } from '../../utils/constants';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { notificationService } from '../../services/notification.service';
import { NotificationCategory } from '../../models/Notification';
import { processPayoutForClaim } from '../../services/payout.service';

export const getPayouts = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { status, search } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {
            review_status: ReviewStatus.APPROVED,
        };

        if (status && status !== 'ALL') {
            whereClause.payout_status = status;
        } else {
            whereClause.payout_status = { [Op.ne]: PayoutStatus.NOT_ELIGIBLE };
        }

        if (search) {
            const searchTerm = `%${search}%`;
            whereClause[Op.or] = [
                { amazon_order_id: { [Op.iLike]: searchTerm } },
                { '$Campaign.product_title$': { [Op.iLike]: searchTerm } },
                { '$Campaign.asin$': { [Op.iLike]: searchTerm } },
                { '$BuyerProfile.User.full_name$': { [Op.iLike]: searchTerm } },
                { '$BuyerProfile.User.email$': { [Op.iLike]: searchTerm } },
            ];
        }

        const { count, rows } = await OrderClaim.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Campaign,
                    attributes: ['asin', 'product_title', 'product_image_url', 'region'],
                    required: true,
                },
                {
                    model: BuyerProfile,
                    attributes: ['id', 'wise_recipient_id', 'bank_display_label'],
                    include: [{ model: User, attributes: ['email', 'full_name'] }],
                },
            ],
            order: [['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching payouts: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updatePayoutStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, override_amount } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!status || !['PROCESSED', 'FAILED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be PROCESSED or FAILED' });
        }

        const claim = await OrderClaim.findByPk(id);
        if (!claim) return res.status(404).json({ message: 'Claim not found' });
        if (claim.payout_status !== PayoutStatus.PENDING) {
            return res.status(400).json({ message: 'Claim is not in PENDING payout status' });
        }

        // If admin wants to override amount, do it before processing
        if (override_amount !== undefined && override_amount !== null) {
            const oldAmount = claim.expected_payout_amount;
            await claim.update({ expected_payout_amount: override_amount });
            await logAdminAction(adminId, 'PAYOUT_AMOUNT_OVERRIDE', id, 'ORDER_CLAIM', JSON.stringify({ old_amount: oldAmount, new_amount: override_amount }), req.ip);
        }

        if (status === 'PROCESSED') {
            // Trigger real Wise payout
            const result = await processPayoutForClaim(id, 'MANUAL', adminId, req.ip);
            if (result.success) {
                return res.status(200).json({ message: 'Payout processed successfully via Wise' });
            } else {
                return res.status(400).json({ message: `Payout failed: ${result.reason}` });
            }
        } else {
            // Mark as FAILED without sending money
            await claim.update({
                payout_status: PayoutStatus.FAILED,
                payout_method: 'MANUAL',
            });

            await logAdminAction(adminId, ADMIN_ACTIONS.PAYOUT_FAILED, id, 'ORDER_CLAIM', JSON.stringify({ status }), req.ip);

            // Notify buyer
            const claimWithAssoc = await OrderClaim.findByPk(id, {
                include: [
                    { model: Campaign, attributes: ['product_title'] },
                    { model: BuyerProfile, attributes: ['user_id'] },
                ],
            });
            type ClaimAssoc = OrderClaim & { BuyerProfile?: { user_id: string }; Campaign?: { product_title: string } };
            const data = claimWithAssoc as ClaimAssoc;
            if (data?.BuyerProfile?.user_id) {
                const productTitle = data.Campaign?.product_title || 'your product';
                notificationService.send(data.BuyerProfile.user_id, NotificationCategory.PAYOUT_FAILED, {
                    message: `Your payout for "${productTitle}" has failed. Please contact support for assistance.`,
                }).catch(err => logger.error('Failed to send payout notification', { err }));
            }

            return res.status(200).json({ message: `Payout status updated to FAILED` });
        }
    } catch (error) {
        logger.error(`Error updating payout status: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const batchUpdatePayouts = async (req: Request, res: Response) => {
    try {
        const { claim_ids, status } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!Array.isArray(claim_ids) || claim_ids.length === 0) {
            return res.status(400).json({ message: 'claim_ids must be a non-empty array' });
        }
        if (!status || !['PROCESSED', 'FAILED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be PROCESSED or FAILED' });
        }

        let succeeded = 0;
        let failed = 0;
        let skipped = 0;

        if (status === 'PROCESSED') {
            // Process each payout individually via Wise
            for (const claimId of claim_ids) {
                const result = await processPayoutForClaim(claimId, 'MANUAL', adminId, req.ip);
                if (result.success) {
                    succeeded++;
                } else if (result.reason?.includes('not in PENDING') || result.reason?.includes('Already processing')) {
                    skipped++;
                } else {
                    failed++;
                }
            }
        } else {
            // Batch mark as FAILED
            const [updatedCount] = await OrderClaim.update(
                { payout_status: PayoutStatus.FAILED, payout_method: 'MANUAL' },
                { where: { id: { [Op.in]: claim_ids }, payout_status: PayoutStatus.PENDING } },
            );
            succeeded = updatedCount;

            // Send notifications for failed payouts
            const claims = await OrderClaim.findAll({
                where: { id: { [Op.in]: claim_ids }, payout_status: PayoutStatus.FAILED },
                include: [
                    { model: Campaign, attributes: ['product_title'] },
                    { model: BuyerProfile, attributes: ['user_id'] },
                ],
            });

            for (const claim of claims) {
                await logAdminAction(adminId, ADMIN_ACTIONS.PAYOUT_FAILED, claim.id, 'ORDER_CLAIM', JSON.stringify({ batch: true, status }), req.ip);
                type ClaimAssoc = OrderClaim & { BuyerProfile?: { user_id: string }; Campaign?: { product_title: string } };
                const data = claim as ClaimAssoc;
                if (data.BuyerProfile?.user_id) {
                    const productTitle = data.Campaign?.product_title || 'your product';
                    notificationService.send(data.BuyerProfile.user_id, NotificationCategory.PAYOUT_FAILED, {
                        message: `Your payout for "${productTitle}" has failed. Please contact support for assistance.`,
                    }).catch(err => logger.error('Failed to send batch payout notification', { err }));
                }
            }
        }

        return res.status(200).json({
            message: `Batch payout update: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped`,
            succeeded,
            failed,
            skipped,
        });
    } catch (error) {
        logger.error(`Error batch updating payouts: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const retryPayout = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

        const claim = await OrderClaim.findByPk(id);
        if (!claim) return res.status(404).json({ message: 'Claim not found' });
        if (claim.payout_status !== PayoutStatus.FAILED) {
            return res.status(400).json({ message: 'Only FAILED payouts can be retried' });
        }

        // Reset to PENDING so processPayoutForClaim can pick it up
        await claim.update({ payout_status: PayoutStatus.PENDING });

        await logAdminAction(adminId, ADMIN_ACTIONS.PAYOUT_RETRIED, id, 'ORDER_CLAIM', JSON.stringify({ previous_status: 'FAILED' }), req.ip);

        const result = await processPayoutForClaim(id, 'MANUAL', adminId, req.ip);
        if (result.success) {
            return res.status(200).json({ message: 'Payout retried successfully' });
        } else {
            return res.status(400).json({ message: `Retry failed: ${result.reason}` });
        }
    } catch (error) {
        logger.error(`Error retrying payout: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
