import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { OrderClaim, PayoutStatus, ReviewStatus } from '../../models/OrderClaim';
import { Campaign } from '../../models/Campaign';
import { BuyerProfile } from '../../models/BuyerProfile';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { logAdminAction } from '../../utils/auditLog';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { notificationService } from '../../services/notification.service';
import { NotificationCategory } from '../../models/Notification';

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
                    attributes: ['id'],
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
        logger.error(`Error fetching payouts: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        const claim = await OrderClaim.findByPk(id, {
            include: [
                { model: Campaign, attributes: ['product_title'] },
                { model: BuyerProfile, attributes: ['user_id'] },
            ],
        });
        if (!claim) return res.status(404).json({ message: 'Claim not found' });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { payout_status: status };
        if (override_amount !== undefined && override_amount !== null) {
            updateData.expected_payout_amount = override_amount;
        }

        await claim.update(updateData);

        const action = override_amount !== undefined ? 'PAYOUT_OVERRIDDEN' :
            status === 'PROCESSED' ? 'PAYOUT_PROCESSED' : 'PAYOUT_FAILED';

        await logAdminAction(
            adminId,
            action,
            id,
            'ORDER_CLAIM',
            JSON.stringify({ status, override_amount }),
            req.ip
        );

        // Notify buyer
        const buyerUserId = (claim as any).BuyerProfile?.user_id;
        const productTitle = (claim as any).Campaign?.product_title || 'your product';
        if (buyerUserId) {
            const category = status === 'PROCESSED' ? NotificationCategory.PAYOUT_PROCESSED : NotificationCategory.PAYOUT_FAILED;
            const message = status === 'PROCESSED'
                ? `Your payout for "${productTitle}" has been processed successfully.`
                : `Your payout for "${productTitle}" has failed. Please contact support for assistance.`;
            notificationService.send(buyerUserId, category, { message })
                .catch(err => logger.error('Failed to send payout notification', { err }));
        }

        return res.status(200).json({ message: `Payout status updated to ${status}`, claim });
    } catch (error) {
        logger.error(`Error updating payout status: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        const [updatedCount] = await OrderClaim.update(
            { payout_status: status },
            { where: { id: { [Op.in]: claim_ids }, payout_status: PayoutStatus.PENDING } }
        );

        // Fetch claims with buyer info for notifications
        const claims = await OrderClaim.findAll({
            where: { id: { [Op.in]: claim_ids } },
            include: [
                { model: Campaign, attributes: ['product_title'] },
                { model: BuyerProfile, attributes: ['user_id'] },
            ],
        });

        for (const claim of claims) {
            await logAdminAction(
                adminId,
                status === 'PROCESSED' ? 'PAYOUT_PROCESSED' : 'PAYOUT_FAILED',
                claim.id,
                'ORDER_CLAIM',
                JSON.stringify({ batch: true, status }),
                req.ip
            );

            // Notify buyer
            const buyerUserId = (claim as any).BuyerProfile?.user_id;
            const productTitle = (claim as any).Campaign?.product_title || 'your product';
            if (buyerUserId) {
                const category = status === 'PROCESSED' ? NotificationCategory.PAYOUT_PROCESSED : NotificationCategory.PAYOUT_FAILED;
                const message = status === 'PROCESSED'
                    ? `Your payout for "${productTitle}" has been processed successfully.`
                    : `Your payout for "${productTitle}" has failed. Please contact support for assistance.`;
                notificationService.send(buyerUserId, category, { message })
                    .catch(err => logger.error('Failed to send batch payout notification', { err }));
            }
        }

        return res.status(200).json({ message: `${updatedCount} payouts updated to ${status}` });
    } catch (error) {
        logger.error(`Error batch updating payouts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
