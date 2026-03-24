import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Transaction } from '../../models/Transaction';
import { User } from '../../models/User';
import { logger, formatError } from '../../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { startOfDay, endOfDay } from 'date-fns';

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 10);
        const { type, status, search, startDate, endDate } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {};

        if (type && type !== 'ALL') whereClause.type = type;
        if (status && status !== 'ALL') whereClause.status = status;

        if (startDate && endDate) {
            whereClause.created_at = { [Op.between]: [startOfDay(new Date(startDate as string)), endOfDay(new Date(endDate as string))] };
        } else if (startDate) {
            whereClause.created_at = { [Op.gte]: startOfDay(new Date(startDate as string)) };
        } else if (endDate) {
            whereClause.created_at = { [Op.lte]: endOfDay(new Date(endDate as string)) };
        }

        if (search) {
            const searchTerm = `%${search}%`;
            whereClause[Op.or] = [
                { stripe_transaction_id: { [Op.iLike]: searchTerm } },
                { wise_transfer_id: { [Op.iLike]: searchTerm } },
            ];
        }

        const { count, rows } = await Transaction.findAndCountAll({
            where: whereClause,
            include: [{ model: User, attributes: ['id', 'email', 'full_name', 'role'] }],
            order: [['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching transactions: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
