import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { OrderClaim, OrderStatus, ReviewStatus, PayoutStatus } from '../../models/OrderClaim';
import { Campaign } from '../../models/Campaign';
import { BuyerProfile } from '../../models/BuyerProfile';
import { User } from '../../models/User';
import { logger, formatError } from '../../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';

const PIPELINE_STAGE_MAP: Record<string, Record<string | symbol, unknown>> = {
    ORDER_VERIFICATION_PENDING: { order_status: OrderStatus.PENDING_VERIFICATION },
    ORDER_REJECTED: { order_status: OrderStatus.REJECTED },
    AWAITING_REVIEW: { order_status: OrderStatus.APPROVED, review_status: ReviewStatus.AWAITING_UPLOAD },
    REVIEW_VERIFICATION_PENDING: { review_status: ReviewStatus.PENDING_VERIFICATION },
    REVIEW_REJECTED: { review_status: ReviewStatus.REJECTED },
    REVIEW_TIMEOUT: { review_status: ReviewStatus.TIMEOUT },
    PAYOUT_PENDING: { review_status: ReviewStatus.APPROVED, payout_status: { [Op.in]: [PayoutStatus.PENDING, PayoutStatus.NOT_ELIGIBLE] } },
    PAYOUT_PROCESSING: { payout_status: PayoutStatus.PROCESSING },
    REIMBURSED: { payout_status: PayoutStatus.PROCESSED },
    PAYOUT_FAILED: { payout_status: PayoutStatus.FAILED },
};

export const getClaims = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { search, pipeline_stage, order_status, review_status, payout_status } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {};

        // Pipeline stage filter takes precedence over individual status filters
        if (pipeline_stage && typeof pipeline_stage === 'string' && PIPELINE_STAGE_MAP[pipeline_stage]) {
            Object.assign(whereClause, PIPELINE_STAGE_MAP[pipeline_stage]);
        } else {
            if (order_status && typeof order_status === 'string' && Object.values(OrderStatus).includes(order_status as OrderStatus)) {
                whereClause.order_status = order_status;
            }
            if (review_status && typeof review_status === 'string' && Object.values(ReviewStatus).includes(review_status as ReviewStatus)) {
                whereClause.review_status = review_status;
            }
            if (payout_status && typeof payout_status === 'string' && Object.values(PayoutStatus).includes(payout_status as PayoutStatus)) {
                whereClause.payout_status = payout_status;
            }
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
                    attributes: ['id', 'asin', 'product_title', 'product_image_url', 'product_price', 'region'],
                    required: true,
                },
                {
                    model: BuyerProfile,
                    attributes: ['id', 'amazon_profile_url', 'region'],
                    include: [{ model: User, attributes: ['id', 'email', 'full_name'] }],
                },
            ],
            order: [['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching claims: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
