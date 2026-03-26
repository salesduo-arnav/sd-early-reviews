import { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { Campaign, CampaignStatus } from '../../models/Campaign';
import { OrderClaim } from '../../models/OrderClaim';
import { SellerProfile } from '../../models/SellerProfile';
import { BuyerProfile } from '../../models/BuyerProfile';
import { User } from '../../models/User';
import { logger, formatError } from '../../utils/logger';
import { logAdminAction } from '../../utils/auditLog';
import { ADMIN_ACTIONS } from '../../utils/constants';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { notificationService } from '../../services/notification.service';
import { NotificationCategory } from '../../models/Notification';

export const getCampaigns = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { search, status, region } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {};

        if (status && status !== 'ALL') whereClause.status = status;
        if (region) whereClause.region = region;

        if (search) {
            const searchTerm = `%${search}%`;
            whereClause[Op.or] = [
                { product_title: { [Op.iLike]: searchTerm } },
                { asin: { [Op.iLike]: searchTerm } },
                { '$SellerProfile.company_name$': { [Op.iLike]: searchTerm } },
                { '$SellerProfile.User.full_name$': { [Op.iLike]: searchTerm } },
                { '$SellerProfile.User.email$': { [Op.iLike]: searchTerm } },
            ];
        }

        const { count, rows } = await Campaign.findAndCountAll({
            where: whereClause,
            attributes: {
                include: [
                    [Sequelize.literal(`(SELECT COUNT(*) FROM "order_claims" WHERE "order_claims"."campaign_id" = "Campaign"."id" AND "order_claims"."review_status" = 'APPROVED')`), 'completed_reviews'],
                ],
            },
            include: [{
                model: SellerProfile,
                attributes: ['id', 'company_name'],
                include: [{ model: User, attributes: ['email', 'full_name'] }],
            }],
            order: [['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching campaigns: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCampaignDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await Campaign.findByPk(id, {
            include: [{
                model: SellerProfile,
                attributes: ['id', 'company_name'],
                include: [{ model: User, attributes: ['email', 'full_name'] }],
            }],
        });

        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        const claimsPagination = parsePaginationParams(req.query, 10);
        const { count, rows: claims } = await OrderClaim.findAndCountAll({
            where: { campaign_id: id },
            include: [{
                model: BuyerProfile,
                attributes: ['id'],
                include: [{ model: User, attributes: ['email', 'full_name'] }],
            }],
            order: [['created_at', 'DESC']],
            limit: claimsPagination.limit,
            offset: claimsPagination.offset,
        });

        return res.status(200).json({
            campaign,
            claims: buildPaginatedResponse(claims, count, claimsPagination),
        });
    } catch (error) {
        logger.error(`Error fetching campaign detail: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const toggleCampaignStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

        const campaign = await Campaign.findByPk(id, {
            include: [{ model: SellerProfile, attributes: ['user_id'] }],
        });
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        if (campaign.status === CampaignStatus.COMPLETED) {
            return res.status(400).json({ message: 'Cannot change status of a completed campaign' });
        }

        const oldStatus = campaign.status;
        const newStatus = oldStatus === CampaignStatus.ACTIVE
            ? CampaignStatus.PAUSED
            : CampaignStatus.ACTIVE;

        await campaign.update({ status: newStatus });

        await logAdminAction(
            adminId,
            newStatus === CampaignStatus.PAUSED ? ADMIN_ACTIONS.CAMPAIGN_PAUSED : ADMIN_ACTIONS.CAMPAIGN_RESUMED,
            id,
            'CAMPAIGN',
            JSON.stringify({ previous_status: oldStatus, new_status: newStatus }),
            req.ip
        );

        // Notify seller
        const sellerUserId = (campaign as Campaign & { SellerProfile?: { user_id: string } }).SellerProfile?.user_id;
        if (sellerUserId && newStatus === CampaignStatus.PAUSED) {
            notificationService.send(sellerUserId, NotificationCategory.CAMPAIGN_PAUSED, {
                message: `Your campaign "${campaign.product_title}" has been paused by an admin.`,
            }).catch(err => logger.error('Failed to send campaign paused notification', { err }));
        }

        return res.status(200).json({ message: `Campaign ${newStatus.toLowerCase()} successfully`, campaign });
    } catch (error) {
        logger.error(`Error toggling campaign status: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
