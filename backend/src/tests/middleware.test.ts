import { Request, Response, NextFunction } from 'express';
import { authorizeRole } from '../middlewares/auth.middleware';

// Helper to create mock Express objects
function createMocks(userPayload?: { userId: string; email: string; role: string }) {
    const req = {
        user: userPayload,
    } as Request;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    return { req, res, next };
}

describe('authorizeRole middleware', () => {
    it('should call next() when user has an allowed role', () => {
        const middleware = authorizeRole('ADMIN', 'SELLER');
        const { req, res, next } = createMocks({ userId: '1', email: 'admin@test.com', role: 'ADMIN' });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow a SELLER when SELLER is in allowed roles', () => {
        const middleware = authorizeRole('SELLER');
        const { req, res, next } = createMocks({ userId: '2', email: 'seller@test.com', role: 'SELLER' });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should return 403 when user role is not in allowed roles', () => {
        const middleware = authorizeRole('ADMIN');
        const { req, res, next } = createMocks({ userId: '3', email: 'buyer@test.com', role: 'BUYER' });

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
    });

    it('should return 401 when req.user is undefined', () => {
        const middleware = authorizeRole('ADMIN');
        const { req, res, next } = createMocks(undefined);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: User not authenticated' });
    });

    it('should work with multiple allowed roles', () => {
        const middleware = authorizeRole('ADMIN', 'SELLER', 'BUYER');
        const { req, res, next } = createMocks({ userId: '4', email: 'buyer@test.com', role: 'BUYER' });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should reject when role does not match any allowed role', () => {
        const middleware = authorizeRole('ADMIN', 'SELLER');
        const { req, res, next } = createMocks({ userId: '5', email: 'buyer@test.com', role: 'BUYER' });

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
