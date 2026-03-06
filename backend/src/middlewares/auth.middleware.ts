import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import { User } from '../models';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            const payload = verifyToken<TokenPayload>(token);
            const user = await User.findByPk(payload.userId);

            if (!user) {
                res.status(401).json({ message: 'Unauthorized: User not found' });
                return;
            }

            req.user = payload;
            next();
        } catch (error) {
            logger.warn('Failed to verify JWT or user', { error: (error as Error).message });
            res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
        }
    } else {
        res.status(401).json({ message: 'Unauthorized: Missing token' });
    }
};
export const authorizeRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: User not authenticated' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            return;
        }

        next();
    };
};
