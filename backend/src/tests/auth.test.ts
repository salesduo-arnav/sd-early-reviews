import request from 'supertest';
import app from '../app';
import { User, UserRole } from '../models/User';
import sequelize from '../config/db';

// Mock the mail service so we don't send actual emails
jest.mock('../services/mail.service', () => ({
    mailService: {
        sendMail: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../middlewares/rateLimiter', () => ({
    authRateLimiter: (req: any, res: any, next: any) => next(),
    publicRateLimiter: (req: any, res: any, next: any) => next(),
}));

beforeAll(async () => {
    // Optionally sync or authenticate if needed, but migrations run in global setup.
    await sequelize.authenticate();
    // Check if DB is test db and not production db
    if (process.env.PGDATABASE !== 'mydb_test' || sequelize.getDatabaseName() !== 'mydb_test') {
        throw new Error('Not connected to test database');
    }
});

afterAll(async () => {
    // Close connection to prevent open handles
    await sequelize.close();
});

describe('Authentication Flow Integration Tests', () => {
    const testBuyer = {
        full_name: 'Test Buyer',
        email: 'buyer@example.com',
        password: 'Password123!',
        role: UserRole.BUYER,
        amazon_profile_url: 'https://amazon.com/seller/test',
        region: 'US',
    };

    const testSeller = {
        full_name: 'Test Seller',
        email: 'seller@example.com',
        password: 'Password123!',
        role: UserRole.SELLER,
    };

    let buyerToken = '';

    beforeEach(async () => {
        // Clear users before each test that needs a clean slate, or do it selectively
        // For now, let's just clear the users table to avoid duplicate email errors across tests
        await User.destroy({ where: {}, force: true });
        jest.clearAllMocks();
    });

    describe('POST /api/auth/signup', () => {
        it('should successfully signup a new buyer', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send(testBuyer);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message');
            // Assuming successful signup returns a token or user info
            if (res.body.otpToken) {
                // ... we don't necessarily get an access token on signup, so we don't set buyerToken here
            }

            const user = await User.findOne({ where: { email: testBuyer.email } });
            expect(user).not.toBeNull();
            expect(user?.role).toBe(UserRole.BUYER);
        });

        it('should successfully signup a new seller', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send(testSeller);

            expect(res.status).toBe(201);

            const user = await User.findOne({ where: { email: testSeller.email } });
            expect(user).not.toBeNull();
            expect(user?.role).toBe(UserRole.SELLER);
        });

        it('should fail when missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'incomplete@example.com',
                    // missing full_name, password, and role
                });

            expect(res.status).toBe(400); // Bad Request typically
        });

        it('should fail on duplicate email', async () => {
            // First signup
            await request(app).post('/api/auth/signup').send(testBuyer);
            // Second signup with same email
            const res = await request(app).post('/api/auth/signup').send(testBuyer);

            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Ensure buyer is registered for login tests
            await request(app).post('/api/auth/signup').send(testBuyer);
            // Verify user manually so they can login
            await User.update({ is_verified: true }, { where: { email: testBuyer.email } });
        });

        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testBuyer.email,
                    password: testBuyer.password,
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('tokens');
            buyerToken = res.body.tokens.accessToken; // save for subsequent tests
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testBuyer.email,
                    password: 'WrongPassword!',
                });

            expect([400, 401]).toContain(res.status);
        });

        it('should fail with unregistered email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'unregistered@example.com',
                    password: 'Password123!',
                });

            expect([400, 401, 404]).toContain(res.status);
        });
    });

    describe('GET /api/auth/me', () => {
        beforeEach(async () => {
            // Ensure buyer is registered and logged in
            await request(app).post('/api/auth/signup').send(testBuyer);
            await User.update({ is_verified: true }, { where: { email: testBuyer.email } });
            const loginRes = await request(app).post('/api/auth/login').send({
                email: testBuyer.email,
                password: testBuyer.password,
            });
            buyerToken = loginRes.body.tokens.accessToken;
        });

        it('should return user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${buyerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('email', testBuyer.email);
        });

        it('should fail without authorization header', async () => {
            const res = await request(app).get('/api/auth/me');
            expect([401, 403]).toContain(res.status);
        });

        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid_token_here');

            expect([401, 403]).toContain(res.status);
        });
    });

    describe('Other Auth Flows (OTP & Password Reset)', () => {
        beforeEach(async () => {
            await request(app).post('/api/auth/signup').send(testBuyer);
        });

        it('should request login OTP for registered user', async () => {
            const res = await request(app)
                .post('/api/auth/login-otp-request')
                .send({ email: testBuyer.email });

            expect(res.status).toBe(200);
        });

        it('should fail OTP request for unregistered user', async () => {
            const res = await request(app)
                .post('/api/auth/login-otp-request')
                .send({ email: 'nobody@example.com' });

            // Typically 400, 404, or 200 (to prevent enumeration)
            expect([200, 400, 404]).toContain(res.status);
        });

        it('should request forgot password link/OTP', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testBuyer.email });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
        });
    });
});
