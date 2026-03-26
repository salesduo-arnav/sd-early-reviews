import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { toUSD } from '../../services/exchange-rate.service';
import { Campaign, CampaignStatus } from '../../models/Campaign';
import { OrderClaim, OrderStatus, ReviewStatus, PayoutStatus } from '../../models/OrderClaim';
import { Transaction, TransactionStatus } from '../../models/Transaction';
import { User, UserRole } from '../../models/User';
import { logger, formatError } from '../../utils/logger';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

const DEFAULT_CHART_DAYS = 30;

function parseDateRange(query: Request['query']): { startDate: Date; endDate: Date } {
    const { startDate: startDateStr, endDate: endDateStr } = query;
    const endDate = endDateStr ? endOfDay(new Date(endDateStr as string)) : endOfDay(new Date());
    const startDate = startDateStr ? startOfDay(new Date(startDateStr as string)) : startOfDay(subDays(endDate, DEFAULT_CHART_DAYS - 1));
    return { startDate, endDate };
}

function initDateMap<T>(startDate: Date, endDate: Date, defaultValue: () => T): Record<string, T> {
    const map: Record<string, T> = {};
    for (const day of eachDayOfInterval({ start: startDate, end: endDate })) {
        map[format(day, 'yyyy-MM-dd')] = defaultValue();
    }
    return map;
}

export const getMetrics = async (req: Request, res: Response) => {
    try {
        const [
            revenueRows,
            pendingOrderVerifications,
            pendingReviewVerifications,
            activeCampaigns,
            totalBuyers,
            totalSellers,
            pendingPayouts,
        ] = await Promise.all([
            Transaction.findAll({
                attributes: ['platform_fee', 'currency'],
                where: { type: 'SELLER_CHARGE', status: TransactionStatus.SUCCESS },
                raw: true,
            }),
            OrderClaim.count({ where: { order_status: OrderStatus.PENDING_VERIFICATION } }),
            OrderClaim.count({ where: { review_status: ReviewStatus.PENDING_VERIFICATION } }),
            Campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
            User.count({ where: { role: UserRole.BUYER } }),
            User.count({ where: { role: UserRole.SELLER } }),
            OrderClaim.count({ where: { payout_status: PayoutStatus.PENDING } }),
        ]);

        // Convert all platform fees to USD for a single total
        let platformRevenue = 0;
        for (const row of revenueRows) {
            const fee = parseFloat(String(row.platform_fee)) || 0;
            platformRevenue += await toUSD(fee, row.currency || 'USD');
        }
        platformRevenue = Math.round(platformRevenue * 100) / 100;

        return res.status(200).json({
            platformRevenue,
            pendingOrderVerifications,
            pendingReviewVerifications,
            activeCampaigns,
            totalBuyers,
            totalSellers,
            pendingPayouts,
        });
    } catch (error) {
        logger.error(`Error fetching admin metrics: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getRevenueChart = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = parseDateRange(req.query);

        const transactions = await Transaction.findAll({
            where: {
                type: 'SELLER_CHARGE',
                status: TransactionStatus.SUCCESS,
                created_at: { [Op.between]: [startDate, endDate] },
            },
            attributes: ['platform_fee', 'currency', 'created_at'],
        });

        const revenueMap = initDateMap(startDate, endDate, () => 0);

        for (const t of transactions) {
            const dateStr = format(new Date(t.created_at), 'yyyy-MM-dd');
            if (revenueMap[dateStr] !== undefined) {
                const fee = parseFloat(t.platform_fee.toString());
                revenueMap[dateStr] += await toUSD(fee, t.currency || 'USD');
            }
        }

        const data = Object.keys(revenueMap).sort().map(date => ({
            date,
            revenue: Math.round(revenueMap[date] * 100) / 100,
        }));
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Error fetching revenue chart: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getClaimsChart = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = parseDateRange(req.query);

        const claims = await OrderClaim.findAll({
            where: { created_at: { [Op.between]: [startDate, endDate] } },
            attributes: ['created_at'],
        });

        const claimsMap = initDateMap(startDate, endDate, () => 0);

        claims.forEach(c => {
            const dateStr = format(new Date(c.created_at), 'yyyy-MM-dd');
            if (claimsMap[dateStr] !== undefined) claimsMap[dateStr]++;
        });

        const data = Object.keys(claimsMap).sort().map(date => ({ date, claims: claimsMap[date] }));
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Error fetching claims chart: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getUsersChart = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = parseDateRange(req.query);

        const users = await User.findAll({
            where: { created_at: { [Op.between]: [startDate, endDate] } },
            attributes: ['created_at', 'role'],
        });

        const usersMap = initDateMap(startDate, endDate, () => ({ buyers: 0, sellers: 0 }));

        users.forEach(u => {
            const dateStr = format(new Date(u.created_at), 'yyyy-MM-dd');
            if (usersMap[dateStr]) {
                if (u.role === UserRole.BUYER) usersMap[dateStr].buyers++;
                else if (u.role === UserRole.SELLER) usersMap[dateStr].sellers++;
            }
        });

        const data = Object.keys(usersMap).sort().map(date => ({
            date,
            buyers: usersMap[date].buyers,
            sellers: usersMap[date].sellers,
        }));
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Error fetching users chart: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
