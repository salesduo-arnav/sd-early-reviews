import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

const JWT_ACCESS_TOKEN_EXPIRY = (process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h') as jwt.SignOptions['expiresIn'];
const JWT_REFRESH_TOKEN_EXPIRY = (process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d') as jwt.SignOptions['expiresIn'];
const JWT_OTP_TOKEN_EXPIRY = (process.env.JWT_OTP_TOKEN_EXPIRY || '10m') as jwt.SignOptions['expiresIn'];

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
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_TOKEN_EXPIRY });
};

export const generateOtpToken = (payload: OtpTokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_OTP_TOKEN_EXPIRY });
};

export const verifyToken = <T>(token: string): T => {
    try {
        return jwt.verify(token, JWT_SECRET) as T;
    } catch {
        throw new Error('Invalid token');
    }
};
