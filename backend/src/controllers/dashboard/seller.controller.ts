import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Campaign, CampaignStatus } from '../../models/Campaign';
import { OrderClaim, ReviewStatus } from '../../models/OrderClaim';
import { Transaction, TransactionStatus } from '../../models/Transaction';
import { startOfDay, endOfDay, subDays, startOfWeek, subWeeks, endOfWeek } from 'date-fns';

export const getMetrics = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user?.userId;
        if (!sellerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Active Campaigns
        const activeCampaignsCount = await Campaign.count({
            where: {
                seller_id: sellerId,
                status: CampaignStatus.ACTIVE
            }
        });

        // Reviews Completed (All time for total)
        const totalReviewsCompleted = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.APPROVED
            }
        });

        // Current week vs last week for % change
        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
        const startOfPreviousWeek = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const endOfPreviousWeek = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

        const currentWeekReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.APPROVED,
                review_date: {
                    [Op.gte]: startOfCurrentWeek
                }
            }
        });

        const previousWeekReviews = await OrderClaim.count({
            include: [{
                model: Campaign,
                where: { seller_id: sellerId },
                required: true
            }],
            where: {
                review_status: ReviewStatus.APPROVED,
                review_date: {
                    [Op.between]: [startOfPreviousWeek, endOfPreviousWeek]
                }
            }
        });

        let reviewChangePercent = 0;
        if (previousWeekReviews > 0) {
            reviewChangePercent = ((currentWeekReviews - previousWeekReviews) / previousWeekReviews) * 100;
        } else if (currentWeekReviews > 0) {
            reviewChangePercent = 100; // Infinite growth technically, capping at 100% for UI sanity
        }

        // Total Amount Spent
        const totalSpent = await Transaction.sum('gross_amount', {
            where: {
                user_id: sellerId,
                status: TransactionStatus.SUCCESS
            }
        }) || 0;

        return res.status(200).json({
            activeCampaigns: activeCampaignsCount,
            totalReviews: totalReviewsCompleted,
            reviewChangePercent: parseFloat(reviewChangePercent.toFixed(1)),
            totalSpent: parseFloat(totalSpent.toString())
        });

    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};

export const getReviewVelocity = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user?.userId;
        if (!sellerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Default to last 7 days if not provided
        const startDateStr = req.query.startDate as string;
        const endDateStr = req.query.endDate as string;

        const endDate = endDateStr ? endOfDay(new Date(endDateStr)) : endOfDay(new Date());
        const startDate = startDateStr ? startOfDay(new Date(startDateStr)) : startOfDay(subDays(endDate, 6));

        // Group by day. using standard JS grouping since DB driver group by date might vary
        const reviews = await OrderClaim.findAll({
            include: [{
                model: Campaign,
                where: { seller_id: sellerId },
                required: true,
                attributes: []
            }],
            where: {
                review_status: ReviewStatus.APPROVED,
                review_date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: ['review_date']
        });

        const velocityMap: Record<string, number> = {};

        // Initialize map with 0s for the date range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            velocityMap[dateStr] = 0;
        }

        // Populate counts
        reviews.forEach(review => {
            if (review.review_date) {
                const dateStr = new Date(review.review_date).toISOString().split('T')[0];
                if (velocityMap[dateStr] !== undefined) {
                    velocityMap[dateStr]++;
                }
            }
        });

        const formattedData = Object.keys(velocityMap).sort().map(date => ({
            date, // YYYY-MM-DD format
            completed: velocityMap[date]
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        console.error('Error fetching review velocity:', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};

export const getCampaignProgress = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user?.userId;
        if (!sellerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const campaigns = await Campaign.findAll({
            where: {
                seller_id: sellerId,
                status: {
                    [Op.in]: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED]
                }
            },
            attributes: ['id', 'product_title', 'product_image_url', 'product_price', 'target_reviews', 'status'],
            order: [['created_at', 'DESC']]
        });

        const progressData = await Promise.all(campaigns.map(async (campaign) => {
            const completedReviews = await OrderClaim.count({
                where: {
                    campaign_id: campaign.id,
                    review_status: ReviewStatus.APPROVED
                }
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

        res.status(200).json(progressData);
    } catch (error) {
        console.error('Error fetching campaign progress:', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};
