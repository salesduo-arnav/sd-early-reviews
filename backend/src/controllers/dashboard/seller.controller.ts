import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Campaign, CampaignStatus } from '../../models/Campaign';
import { OrderClaim, ReviewStatus } from '../../models/OrderClaim';
import { Transaction, TransactionStatus } from '../../models/Transaction';
import { SellerProfile } from '../../models/SellerProfile';
import { logger } from '../../utils/logger';
import { startOfDay, endOfDay, subDays, startOfWeek, subWeeks, endOfWeek } from 'date-fns';

/** Shared helper — resolves SellerProfile.id from JWT userId, returns null if not found */
const resolveSellerProfileId = async (userId: string): Promise<string | null> => {
    const profile = await SellerProfile.findOne({ where: { user_id: userId } });
    return profile ? profile.id : null;
};

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
                review_date: { [Op.gte]: startOfCurrentWeek }
            }
        });

        const previousWeekReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerProfileId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.APPROVED,
                review_date: { [Op.between]: [startOfPreviousWeek, endOfPreviousWeek] }
            }
        });

        let reviewChangePercent = 0;
        if (previousWeekReviews > 0) {
            reviewChangePercent = ((currentWeekReviews - previousWeekReviews) / previousWeekReviews) * 100;
        } else if (currentWeekReviews > 0) {
            reviewChangePercent = 100;
        }

        // Total Amount Spent — transactions belong to users (not seller profiles)
        const totalSpent = await Transaction.sum('gross_amount', {
            where: { user_id: userId, status: TransactionStatus.SUCCESS }
        }) || 0;

        return res.status(200).json({
            activeCampaigns: activeCampaignsCount,
            totalReviews: totalReviewsCompleted,
            reviewChangePercent: parseFloat(reviewChangePercent.toFixed(1)),
            totalSpent: parseFloat(totalSpent.toString())
        });

    } catch (error) {
        logger.error(`Error fetching dashboard metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                review_date: { [Op.between]: [startDate, endDate] }
            },
            attributes: ['review_date']
        });

        const velocityMap: Record<string, number> = {};

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            velocityMap[d.toISOString().split('T')[0]] = 0;
        }

        reviews.forEach(review => {
            if (review.review_date) {
                const dateStr = new Date(review.review_date).toISOString().split('T')[0];
                if (velocityMap[dateStr] !== undefined) velocityMap[dateStr]++;
            }
        });

        const formattedData = Object.keys(velocityMap).sort().map(date => ({ date, completed: velocityMap[date] }));

        return res.status(200).json(formattedData);
    } catch (error) {
        logger.error(`Error fetching review velocity: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCampaignProgress = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const sellerProfileId = await resolveSellerProfileId(userId);
        if (!sellerProfileId) return res.status(403).json({ message: 'Seller profile not found' });

        const campaigns = await Campaign.findAll({
            where: {
                seller_id: sellerProfileId,
                status: { [Op.in]: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED] }
            },
            attributes: ['id', 'product_title', 'product_image_url', 'product_price', 'target_reviews', 'status'],
            order: [['created_at', 'DESC']]
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
                completed: completedReviews
            };
        }));

        return res.status(200).json(progressData);
    } catch (error) {
        logger.error(`Error fetching campaign progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
