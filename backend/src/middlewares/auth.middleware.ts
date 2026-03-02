import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            const user = verifyToken<TokenPayload>(token);
            req.user = user;
            next();
        } catch (error) {
            logger.warn('Failed to verify JWT', { error: (error as Error).message });
            res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
        }
    } else {
        res.status(401).json({ message: 'Unauthorized: Missing token' });
    }
};
