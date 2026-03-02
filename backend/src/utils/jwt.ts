import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-DO-NOT-USE-IN-PROD';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export interface OtpTokenPayload {
    email: string;
    otpHash: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const generateOtpToken = (payload: OtpTokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
};

export const verifyToken = <T>(token: string): T => {
    try {
        return jwt.verify(token, JWT_SECRET) as T;
    } catch (error) {
        throw new Error('Invalid token');
    }
};
