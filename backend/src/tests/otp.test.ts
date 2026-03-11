import { generateOtp, hashOtp, verifyOtpHash } from '../utils/otp';

describe('OTP Utilities', () => {
    describe('generateOtp', () => {
        it('should generate a 6-digit string', () => {
            const otp = generateOtp();
            expect(otp).toMatch(/^\d{6}$/);
        });

        it('should generate different OTPs on successive calls', () => {
            const otps = new Set(Array.from({ length: 20 }, () => generateOtp()));
            // With 20 random 6-digit numbers, we should get at least 2 unique values
            expect(otps.size).toBeGreaterThan(1);
        });

        it('should return a string, not a number', () => {
            const otp = generateOtp();
            expect(typeof otp).toBe('string');
        });

        it('should generate OTP in valid range (100000 to 999999)', () => {
            for (let i = 0; i < 50; i++) {
                const otp = parseInt(generateOtp(), 10);
                expect(otp).toBeGreaterThanOrEqual(100000);
                expect(otp).toBeLessThanOrEqual(999999);
            }
        });
    });

    describe('hashOtp', () => {
        it('should return a bcrypt hash string', async () => {
            const hash = await hashOtp('123456');
            expect(hash).toBeDefined();
            expect(hash).not.toBe('123456');
            // bcrypt hashes start with $2a$ or $2b$
            expect(hash).toMatch(/^\$2[ab]\$/);
        });

        it('should produce different hashes for the same OTP', async () => {
            const hash1 = await hashOtp('123456');
            const hash2 = await hashOtp('123456');
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('verifyOtpHash', () => {
        it('should return true for matching OTP and hash', async () => {
            const otp = '654321';
            const hash = await hashOtp(otp);
            const isValid = await verifyOtpHash(otp, hash);
            expect(isValid).toBe(true);
        });

        it('should return false for non-matching OTP', async () => {
            const hash = await hashOtp('123456');
            const isValid = await verifyOtpHash('654321', hash);
            expect(isValid).toBe(false);
        });

        it('should work with generated OTPs end-to-end', async () => {
            const otp = generateOtp();
            const hash = await hashOtp(otp);
            expect(await verifyOtpHash(otp, hash)).toBe(true);
            expect(await verifyOtpHash('000000', hash)).toBe(false);
        });
    });
});
