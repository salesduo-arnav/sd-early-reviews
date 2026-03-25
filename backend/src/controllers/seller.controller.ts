import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { OrderClaim, ReviewStatus } from '../models/OrderClaim';
import sequelize from '../config/db';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { SellerProfile } from '../models/SellerProfile';
import { logger, formatError } from '../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { toUSD } from '../services/exchange-rate.service';
import { startOfDay, endOfDay, subDays, startOfWeek, subWeeks, endOfWeek, format } from 'date-fns';
import { resolveSellerProfileId } from '../utils/profileResolvers';

export const getMetrics = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const sellerProfileId = await resolveSellerProfileId(userId);
        if (!sellerProfileId) return res.status(403).json({ message: 'Seller profile not found' });

        // Active Campaigns
        const activeCampaignsCount = await Campaign.count({
            where: { seller_id: sellerProfileId, status: CampaignStatus.ACTIVE }
        });

        // Reviews Completed (All time)
        const totalReviewsCompleted = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true
            }],
            where: { review_status: ReviewStatus.APPROVED }
        });

        // Current week vs last week for % change
        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
        const startOfPreviousWeek = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const endOfPreviousWeek = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

        const currentWeekReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.APPROVED,
                [Op.or]: [
                    { review_date: { [Op.gte]: startOfCurrentWeek } },
                    { review_date: null, created_at: { [Op.gte]: startOfCurrentWeek } }
                ]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize Op.or with null check requires any cast
            } as any
        });

        const previousWeekReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.APPROVED,
                [Op.or]: [
                    { review_date: { [Op.between]: [startOfPreviousWeek, endOfPreviousWeek] } },
                    { review_date: null, created_at: { [Op.between]: [startOfPreviousWeek, endOfPreviousWeek] } }
                ]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize Op.or with null check requires any cast
            } as any
        });

        let reviewChangePercent = 0;
        if (previousWeekReviews > 0) {
            reviewChangePercent = ((currentWeekReviews - previousWeekReviews) / previousWeekReviews) * 100;
        } else if (currentWeekReviews > 0) {
            reviewChangePercent = 100;
        }

        // Total Amount Spent — convert each transaction to USD for a consistent total
        const spentRows = await Transaction.findAll({
            attributes: ['gross_amount', 'currency'],
            where: { user_id: userId, status: TransactionStatus.SUCCESS },
            raw: true,
        });
        let totalSpent = 0;
        for (const row of spentRows) {
            const amt = parseFloat(String(row.gross_amount)) || 0;
            totalSpent += await toUSD(amt, row.currency || 'USD');
        }
        totalSpent = Math.round(totalSpent * 100) / 100;

        return res.status(200).json({
            activeCampaigns: activeCampaignsCount,
            totalReviews: totalReviewsCompleted,
            reviewChangePercent: parseFloat(reviewChangePercent.toFixed(1)),
            totalSpent,
            currency: 'USD',
        });

    } catch (error) {
        logger.error(`Error fetching dashboard metrics: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getReviewVelocity = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const sellerProfileId = await resolveSellerProfileId(userId);
        if (!sellerProfileId) return res.status(403).json({ message: 'Seller profile not found' });

        const startDateStr = req.query.startDate as string;
        const endDateStr = req.query.endDate as string;

        const endDate = endDateStr ? endOfDay(new Date(endDateStr)) : endOfDay(new Date());
        const startDate = startDateStr ? startOfDay(new Date(startDateStr)) : startOfDay(subDays(endDate, 6));

        const reviews = await OrderClaim.findAll({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true,
                attributes: []
            }],
            where: {
                review_status: ReviewStatus.APPROVED,
                [Op.or]: [
                    { review_date: { [Op.between]: [startDate, endDate] } },
                    { review_date: null, created_at: { [Op.between]: [startDate, endDate] } }
                ]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize Op.or with null check requires any cast
            } as any,
            attributes: ['review_date', 'created_at']
        });

        const velocityMap: Record<string, number> = {};

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            velocityMap[format(d, 'yyyy-MM-dd')] = 0;
        }

        reviews.forEach(review => {
            const effectiveDate = review.review_date || review.created_at;
            if (effectiveDate) {
                const dateStr = format(new Date(effectiveDate), 'yyyy-MM-dd');
                if (velocityMap[dateStr] !== undefined) velocityMap[dateStr]++;
            }
        });

        const formattedData = Object.keys(velocityMap).sort().map(date => ({ date, completed: velocityMap[date] }));

        return res.status(200).json(formattedData);
    } catch (error) {
        logger.error(`Error fetching review velocity: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCampaignProgress = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const sellerProfileId = await resolveSellerProfileId(userId);
        if (!sellerProfileId) return res.status(403).json({ message: 'Seller profile not found' });

        const paginationParams = parsePaginationParams(req.query, 6);

        const { count, rows: campaigns } = await Campaign.findAndCountAll({
            where: {
                seller_id: sellerProfileId,
                status: { [Op.in]: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED] }
            },
            attributes: ['id', 'product_title', 'product_image_url', 'product_price', 'product_rating', 'product_rating_count', 'target_reviews', 'status'],
            order: [['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
        });

        const progressData = await Promise.all(campaigns.map(async (campaign) => {
            const completedReviews = await OrderClaim.count({
                where: { campaign_id: campaign.id, review_status: ReviewStatus.APPROVED }
            });
            return {
                id: campaign.id,
                title: campaign.product_title,
                image: campaign.product_image_url,
                price: campaign.product_price,
                status: campaign.status,
                target: campaign.target_reviews,
                completed: completedReviews,
                product_rating: campaign.product_rating ?? null,
                product_rating_count: campaign.product_rating_count ?? null,
            };
        }));

        return res.status(200).json(buildPaginatedResponse(progressData, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching campaign progress: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSellerReviewStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const sellerProfileId = await resolveSellerProfileId(userId);
        if (!sellerProfileId) return res.status(403).json({ message: 'Seller profile not found' });

        const totalReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true
            }],
            where: {
                review_status: { [Op.ne]: ReviewStatus.AWAITING_UPLOAD }
            }
        });

        const approvedReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.APPROVED
            }
        });

        const pendingReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.PENDING_VERIFICATION
            }
        });

        const ratingData = await OrderClaim.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('review_rating')), 'total_rating'],
                [sequelize.fn('COUNT', sequelize.col('review_rating')), 'rating_count']
            ],
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true,
                attributes: []
            }],
            where: {
                review_status: { [Op.ne]: ReviewStatus.AWAITING_UPLOAD },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize Op.not with null requires any cast
                review_rating: { [Op.not]: null } as any
            },
            raw: true
        });

        const row = ratingData[0] as unknown as { total_rating: string | null; rating_count: string | null } | undefined;
        const sumResult = Number(row?.total_rating || 0);
        const countNum = Number(row?.rating_count || 0);

        const averageRating = countNum > 0 ? (sumResult / countNum).toFixed(1) : 0;

        return res.status(200).json({
            totalReviews,
            approvedReviews,
            pendingReviews,
            averageRating: parseFloat(averageRating as string)
        });
    } catch (error) {
        logger.error(`Error fetching review stats: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSellerReviews = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const sellerProfileId = await resolveSellerProfileId(userId);
        if (!sellerProfileId) return res.status(403).json({ message: 'Seller profile not found' });

        const paginationParams = parsePaginationParams(req.query, 10);

        const { search, status, rating, startDate, endDate } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Sequelize where with Op.or and nested $column$ refs
        const whereClause: Record<string | symbol, any> = {
            review_status: { [Op.ne]: ReviewStatus.AWAITING_UPLOAD }
        };

        if (status && status !== 'ALL') {
            whereClause.review_status = status;
        }

        if (rating && rating !== 'ALL') {
            whereClause.review_rating = parseInt(rating as string, 10);
        }

        if (startDate && endDate) {
            whereClause.review_date = {
                [Op.between]: [startOfDay(new Date(startDate as string)), endOfDay(new Date(endDate as string))]
            };
        } else if (startDate) {
            whereClause.review_date = {
                [Op.gte]: startOfDay(new Date(startDate as string))
            };
        } else if (endDate) {
            whereClause.review_date = {
                [Op.lte]: endOfDay(new Date(endDate as string))
            };
        }

        if (search) {
            const searchTerm = `%${search}%`;
            whereClause[Op.or] = [
                { review_text: { [Op.iLike]: searchTerm } },
                { '$Campaign.asin$': { [Op.iLike]: searchTerm } },
                { amazon_order_id: { [Op.iLike]: searchTerm } }
            ];
        }

        const { count, rows: reviews } = await OrderClaim.findAndCountAll({
            where: whereClause,
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true,
                attributes: ['id', 'asin', 'product_title', 'product_image_url', 'region']
            }],
            order: [['review_date', 'DESC NULLS LAST'], ['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false
        });

        type ReviewWithCampaign = OrderClaim & { Campaign?: { asin: string; product_title: string; product_image_url: string; region: string } };
        const formattedReviews = reviews.map(r => {
            const rc = r as ReviewWithCampaign;
            return {
            id: r.id,
            campaign_id: r.campaign_id,
            asin: rc.Campaign?.asin,
            product_title: rc.Campaign?.product_title,
            product_image_url: rc.Campaign?.product_image_url,
            review_date: r.review_date,
            review_rating: r.review_rating,
            review_text: r.review_text,
            review_status: r.review_status,
            amazon_order_id: r.amazon_order_id,
            expected_payout_amount: r.expected_payout_amount,
            rejection_reason: r.rejection_reason,
            region: rc.Campaign?.region
            };
        });

        return res.status(200).json(buildPaginatedResponse(formattedReviews, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching seller reviews: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
