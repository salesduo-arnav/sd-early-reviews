import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { SellerProfile } from '../../models/SellerProfile';
import { User } from '../../models/User';
import { Campaign } from '../../models/Campaign';
import { Transaction, TransactionStatus } from '../../models/Transaction';
import { logger, formatError } from '../../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { toUSD } from '../../services/exchange-rate.service';

export const getSellers = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { search } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userWhereClause: Record<string | symbol, any> = {};

        if (search) {
            const searchTerm = `%${search}%`;
            userWhereClause[Op.or] = [
                { email: { [Op.iLike]: searchTerm } },
                { full_name: { [Op.iLike]: searchTerm } },
            ];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sellerWhereClause: Record<string | symbol, any> = {};
        if (search) {
            const searchTerm = `%${search}%`;
            sellerWhereClause[Op.or] = [
                { company_name: { [Op.iLike]: searchTerm } },
            ];
        }

        // Combine search across user and seller fields
        const where = search ? {
            [Op.or]: [
                ...(sellerWhereClause[Op.or] || []),
            ],
        } : {};

        const { count, rows } = await SellerProfile.findAndCountAll({
            where: Object.keys(where).length > 0 ? where : undefined,
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
        logger.error(`Error fetching sellers: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSellerDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const seller = await SellerProfile.findByPk(id, {
            include: [{ model: User, attributes: ['id', 'email', 'full_name', 'is_verified', 'created_at'] }],
        });

        if (!seller) return res.status(404).json({ message: 'Seller not found' });

        const campaignsPagination = parsePaginationParams(req.query, 5);
        const { count: campaignsCount, rows: campaigns } = await Campaign.findAndCountAll({
            where: { seller_id: id },
            order: [['created_at', 'DESC']],
            limit: campaignsPagination.limit,
            offset: campaignsPagination.offset,
        });

        const spentRows = await Transaction.findAll({
            attributes: ['gross_amount', 'currency'],
            where: { user_id: seller.user_id, status: TransactionStatus.SUCCESS },
            raw: true,
        });
        let totalSpent = 0;
        for (const row of spentRows) {
            totalSpent += await toUSD(parseFloat(String(row.gross_amount)) || 0, row.currency || 'USD');
        }
        totalSpent = Math.round(totalSpent * 100) / 100;

        return res.status(200).json({
            seller,
            campaigns: buildPaginatedResponse(campaigns, campaignsCount, campaignsPagination),
            totalSpent,
        });
    } catch (error) {
        logger.error(`Error fetching seller detail: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
