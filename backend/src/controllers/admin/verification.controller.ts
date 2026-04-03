import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { OrderClaim, OrderStatus, ReviewStatus, PayoutStatus } from '../../models/OrderClaim';
import { Campaign } from '../../models/Campaign';
import { BuyerProfile } from '../../models/BuyerProfile';
import { User } from '../../models/User';
import { logger, formatError } from '../../utils/logger';
import { logAdminAction } from '../../utils/auditLog';
import { ADMIN_ACTIONS, VERIFICATION_METHOD } from '../../utils/constants';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { notificationService } from '../../services/notification.service';
import { NotificationCategory } from '../../models/Notification';

type ClaimWithAssociations = OrderClaim & { BuyerProfile?: { user_id: string }; Campaign?: { product_title: string } };

export const getPendingOrders = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { search } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {
            order_status: OrderStatus.PENDING_VERIFICATION,
        };

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
                    attributes: ['id', 'asin', 'product_title', 'product_image_url', 'product_price', 'region'],
                    required: true,
                },
                {
                    model: BuyerProfile,
                    attributes: ['id', 'amazon_profile_url', 'region'],
                    include: [{ model: User, attributes: ['id', 'email', 'full_name'] }],
                },
            ],
            order: [['created_at', 'ASC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching pending orders: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPendingReviews = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { search } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {
            review_status: ReviewStatus.PENDING_VERIFICATION,
        };

        if (search) {
            const searchTerm = `%${search}%`;
            whereClause[Op.or] = [
                { amazon_order_id: { [Op.iLike]: searchTerm } },
                { review_text: { [Op.iLike]: searchTerm } },
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
                    attributes: ['id', 'asin', 'product_title', 'product_image_url', 'product_price', 'region'],
                    required: true,
                },
                {
                    model: BuyerProfile,
                    attributes: ['id', 'amazon_profile_url', 'region'],
                    include: [{ model: User, attributes: ['id', 'email', 'full_name'] }],
                },
            ],
            order: [['created_at', 'ASC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching pending reviews: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getClaimDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const claim = await OrderClaim.findByPk(id, {
            include: [
                {
                    model: Campaign,
                    attributes: ['id', 'asin', 'product_title', 'product_image_url', 'product_price', 'region', 'reimbursement_percent', 'guidelines'],
                },
                {
                    model: BuyerProfile,
                    attributes: ['id', 'amazon_profile_url', 'region', 'on_time_submission_rate', 'is_blacklisted', 'total_earnings'],
                    include: [{ model: User, attributes: ['id', 'email', 'full_name'] }],
                },
            ],
        });

        if (!claim) return res.status(404).json({ message: 'Claim not found' });

        return res.status(200).json(claim);
    } catch (error) {
        logger.error(`Error fetching claim detail: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const verifyOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be APPROVE or REJECT' });
        }
        if (action === 'REJECT' && !reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const claim = await OrderClaim.findByPk(id, {
            include: [
                { model: Campaign, attributes: ['product_title'] },
                { model: BuyerProfile, attributes: ['user_id'] },
            ],
        });
        if (!claim) return res.status(404).json({ message: 'Claim not found' });
        if (claim.order_status !== OrderStatus.PENDING_VERIFICATION) {
            return res.status(400).json({ message: 'Order is not pending verification' });
        }

        const updateData: Partial<OrderClaim> = {
            order_status: action === 'APPROVE' ? OrderStatus.APPROVED : OrderStatus.REJECTED,
            verified_by_admin_id: adminId,
            verification_method: VERIFICATION_METHOD.MANUAL,
        };

        if (action === 'APPROVE') {
            updateData.rejection_reason = null;
        } else {
            updateData.rejection_reason = reason;
        }

        await claim.update(updateData);

        await logAdminAction(
            adminId,
            action === 'APPROVE' ? ADMIN_ACTIONS.VERIFY_ORDER_APPROVED : ADMIN_ACTIONS.VERIFY_ORDER_REJECTED,
            id,
            'ORDER_CLAIM',
            reason ? JSON.stringify({ reason }) : undefined,
            req.ip
        );

        // Notify buyer
        const claimWithAssoc = claim as ClaimWithAssociations;
        const buyerUserId = claimWithAssoc.BuyerProfile?.user_id;
        const productTitle = claimWithAssoc.Campaign?.product_title || 'your product';
        if (buyerUserId) {
            if (action === 'APPROVE') {
                notificationService.send(buyerUserId, NotificationCategory.ORDER_APPROVED, {
                    message: `Your order for "${productTitle}" has been verified and approved. You can now submit your review.`,
                }).catch(err => logger.error('Failed to send order approval notification', { err }));
            } else {
                notificationService.send(buyerUserId, NotificationCategory.ORDER_REJECTED, {
                    message: `Your order for "${productTitle}" has been rejected. Reason: ${reason}`,
                }).catch(err => logger.error('Failed to send order rejection notification', { err }));
            }
        }

        return res.status(200).json({ message: `Order ${action.toLowerCase()}d successfully`, claim });
    } catch (error) {
        logger.error(`Error verifying order: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const verifyReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be APPROVE or REJECT' });
        }
        if (action === 'REJECT' && !reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const claim = await OrderClaim.findByPk(id, {
            include: [
                { model: Campaign, attributes: ['product_title'] },
                { model: BuyerProfile, attributes: ['user_id'] },
            ],
        });
        if (!claim) return res.status(404).json({ message: 'Claim not found' });
        if (claim.review_status !== ReviewStatus.PENDING_VERIFICATION) {
            return res.status(400).json({ message: 'Review is not pending verification' });
        }

        const updateData: Partial<OrderClaim> = {
            review_status: action === 'APPROVE' ? ReviewStatus.APPROVED : ReviewStatus.REJECTED,
            verified_by_admin_id: adminId,
        };

        if (action === 'APPROVE') {
            updateData.payout_status = PayoutStatus.PENDING;
            updateData.review_approved_at = new Date();
            updateData.review_verification_method = VERIFICATION_METHOD.MANUAL;
            updateData.rejection_reason = null;
        } else {
            updateData.rejection_reason = reason;
        }

        await claim.update(updateData);

        await logAdminAction(
            adminId,
            action === 'APPROVE' ? ADMIN_ACTIONS.VERIFY_REVIEW_APPROVED : ADMIN_ACTIONS.VERIFY_REVIEW_REJECTED,
            id,
            'ORDER_CLAIM',
            reason ? JSON.stringify({ reason }) : undefined,
            req.ip
        );

        // Notify buyer
        const reviewClaimWithAssoc = claim as ClaimWithAssociations;
        const buyerUserId = reviewClaimWithAssoc.BuyerProfile?.user_id;
        const productTitle = reviewClaimWithAssoc.Campaign?.product_title || 'your product';
        if (buyerUserId) {
            if (action === 'APPROVE') {
                notificationService.send(buyerUserId, NotificationCategory.REVIEW_APPROVED, {
                    message: `Your review for "${productTitle}" has been approved. Your payout is now pending.`,
                }).catch(err => logger.error('Failed to send review approval notification', { err }));
            } else {
                notificationService.send(buyerUserId, NotificationCategory.REVIEW_REJECTED, {
                    message: `Your review for "${productTitle}" has been rejected. Reason: ${reason}`,
                }).catch(err => logger.error('Failed to send review rejection notification', { err }));
            }
        }

        return res.status(200).json({ message: `Review ${action.toLowerCase()}d successfully`, claim });
    } catch (error) {
        logger.error(`Error verifying review: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
