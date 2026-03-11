import { generateAccessToken, generateRefreshToken, generateOtpToken, verifyToken, TokenPayload, OtpTokenPayload } from '../utils/jwt';

describe('JWT Utilities', () => {
    const testPayload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'SELLER',
    };

    describe('generateAccessToken', () => {
        it('should generate a valid JWT string', () => {
            const token = generateAccessToken(testPayload);
            expect(typeof token).toBe('string');
            // JWT has 3 parts separated by dots
            expect(token.split('.')).toHaveLength(3);
        });

        it('should contain the correct payload when verified', () => {
            const token = generateAccessToken(testPayload);
            const decoded = verifyToken<TokenPayload>(token);
            expect(decoded.userId).toBe(testPayload.userId);
            expect(decoded.email).toBe(testPayload.email);
            expect(decoded.role).toBe(testPayload.role);
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid JWT string', () => {
            const token = generateRefreshToken(testPayload);
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('should contain the correct payload when verified', () => {
            const token = generateRefreshToken(testPayload);
            const decoded = verifyToken<TokenPayload>(token);
            expect(decoded.userId).toBe(testPayload.userId);
            expect(decoded.email).toBe(testPayload.email);
            expect(decoded.role).toBe(testPayload.role);
        });

        it('should produce a different token than access token', () => {
            const accessToken = generateAccessToken(testPayload);
            const refreshToken = generateRefreshToken(testPayload);
            expect(accessToken).not.toBe(refreshToken);
        });
    });

    describe('generateOtpToken', () => {
        const otpPayload: OtpTokenPayload = {
            email: 'test@example.com',
            otpHash: '$2a$10$somehash',
        };

        it('should generate a valid JWT string', () => {
            const token = generateOtpToken(otpPayload);
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('should contain the correct payload when verified', () => {
            const token = generateOtpToken(otpPayload);
            const decoded = verifyToken<OtpTokenPayload>(token);
            expect(decoded.email).toBe(otpPayload.email);
            expect(decoded.otpHash).toBe(otpPayload.otpHash);
        });
    });

    describe('verifyToken', () => {
        it('should decode a valid token', () => {
            const token = generateAccessToken(testPayload);
            const decoded = verifyToken<TokenPayload>(token);
            expect(decoded.userId).toBe('user-123');
        });

        it('should throw for an invalid token', () => {
            expect(() => verifyToken('invalid.token.here')).toThrow('Invalid token');
        });

        it('should throw for a malformed token', () => {
            expect(() => verifyToken('not-a-jwt')).toThrow('Invalid token');
        });

        it('should throw for an empty string', () => {
            expect(() => verifyToken('')).toThrow('Invalid token');
        });

        it('should include iat and exp in decoded token', () => {
            const token = generateAccessToken(testPayload);
            const decoded = verifyToken<TokenPayload & { iat: number; exp: number }>(token);
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeDefined();
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
    });
});
