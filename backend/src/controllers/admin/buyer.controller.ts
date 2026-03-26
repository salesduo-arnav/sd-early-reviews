import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { BuyerProfile } from '../../models/BuyerProfile';
import { User } from '../../models/User';
import { OrderClaim } from '../../models/OrderClaim';
import { Campaign } from '../../models/Campaign';
import { logger, formatError } from '../../utils/logger';
import { logAdminAction } from '../../utils/auditLog';
import { ADMIN_ACTIONS } from '../../utils/constants';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';

export const getBuyers = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { search, blacklisted, region } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userWhereClause: Record<string | symbol, any> = {};

        if (blacklisted === 'true') whereClause.is_blacklisted = true;
        else if (blacklisted === 'false') whereClause.is_blacklisted = false;

        if (region) whereClause.region = region;

        if (search) {
            const searchTerm = `%${search}%`;
            userWhereClause[Op.or] = [
                { email: { [Op.iLike]: searchTerm } },
                { full_name: { [Op.iLike]: searchTerm } },
            ];
        }

        const { count, rows } = await BuyerProfile.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['id', 'email', 'full_name', 'is_verified', 'created_at'],
                where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
                required: true,
            }],
            order: [[User, 'created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching buyers: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getBuyerDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const buyer = await BuyerProfile.findByPk(id, {
            include: [{ model: User, attributes: ['id', 'email', 'full_name', 'is_verified', 'created_at'] }],
        });

        if (!buyer) return res.status(404).json({ message: 'Buyer not found' });

        const claimsPagination = parsePaginationParams(req.query, 5);
        const { count: claimsCount, rows: claims } = await OrderClaim.findAndCountAll({
            where: { buyer_id: id },
            include: [{ model: Campaign, attributes: ['asin', 'product_title', 'product_image_url', 'region'] }],
            order: [['created_at', 'DESC']],
            limit: claimsPagination.limit,
            offset: claimsPagination.offset,
        });

        return res.status(200).json({
            buyer,
            claims: buildPaginatedResponse(claims, claimsCount, claimsPagination),
        });
    } catch (error) {
        logger.error(`Error fetching buyer detail: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const toggleBlacklist = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_blacklisted, reason } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (typeof is_blacklisted !== 'boolean') {
            return res.status(400).json({ message: 'is_blacklisted must be a boolean' });
        }

        const buyer = await BuyerProfile.findByPk(id);
        if (!buyer) return res.status(404).json({ message: 'Buyer not found' });

        await buyer.update({
            is_blacklisted,
            blacklist_reason: is_blacklisted ? (reason || null) : null,
            blacklisted_at: is_blacklisted ? new Date() : null,
            blacklisted_by: is_blacklisted ? adminId : null,
        });

        await logAdminAction(
            adminId,
            is_blacklisted ? ADMIN_ACTIONS.BUYER_BLACKLISTED : ADMIN_ACTIONS.BUYER_UNBLACKLISTED,
            id,
            'BUYER_PROFILE',
            reason ? JSON.stringify({ reason }) : undefined,
            req.ip
        );

        return res.status(200).json({
            message: `Buyer ${is_blacklisted ? 'blacklisted' : 'unblacklisted'} successfully`,
            buyer,
        });
    } catch (error) {
        logger.error(`Error toggling blacklist: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
