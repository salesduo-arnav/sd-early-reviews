import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AdminAuditLog } from '../../models/AdminAuditLog';
import { User } from '../../models/User';
import { logger, formatError } from '../../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { startOfDay, endOfDay } from 'date-fns';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const paginationParams = parsePaginationParams(req.query, 20);
        const { search, startDate, endDate } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {};

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
                { action: { [Op.iLike]: searchTerm } },
                { target_type: { [Op.iLike]: searchTerm } },
            ];
        }

        const { count, rows } = await AdminAuditLog.findAndCountAll({
            where: whereClause,
            include: [{ model: User, attributes: ['id', 'email', 'full_name'] }],
            order: [['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
            subQuery: false,
        });

        return res.status(200).json(buildPaginatedResponse(rows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching audit logs: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
