import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        logger.warn(`[${err.statusCode}] ${err.message}`, { path: req.path });
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }

    logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};
