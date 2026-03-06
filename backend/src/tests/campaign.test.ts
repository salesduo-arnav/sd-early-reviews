import request from 'supertest';
import app from '../app';
import sequelize from '../config/db';
import { User } from '../models/User';
import { SellerProfile } from '../models/SellerProfile';
import { BuyerProfile } from '../models/BuyerProfile';
import { Campaign } from '../models/Campaign';
import { OrderClaim } from '../models/OrderClaim';
import { Transaction } from '../models/Transaction';
import { Notification } from '../models/Notification';
import {
    createSellerAndLogin,
    createBuyerAndLogin,
    createCampaignViaAPI,
    defaultCampaignData,
    resetCounters,
} from './helpers';

jest.mock('../services/mail.service', () => ({
    mailService: { sendMail: jest.fn().mockResolvedValue(true) },
}));

jest.mock('../services/amazon.service', () => ({
    fetchAsinDetailsRealTime: jest.fn(),
}));

jest.mock('../middlewares/rateLimiter', () => ({
    authRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
    publicRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fetchAsinDetailsRealTime } = require('../services/amazon.service');

beforeAll(async () => {
    await sequelize.authenticate();
    if (sequelize.getDatabaseName() !== 'mydb_test') {
        throw new Error('Not connected to test database');
    }
});

afterAll(async () => {
    await sequelize.close();
});

describe('Campaign API', () => {
    beforeEach(async () => {
        await OrderClaim.destroy({ where: {}, force: true });
        await Campaign.destroy({ where: {}, force: true });
        await Transaction.destroy({ where: {}, force: true });
        await Notification.destroy({ where: {}, force: true });
        await BuyerProfile.destroy({ where: {}, force: true });
        await SellerProfile.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });
        resetCounters();
        jest.clearAllMocks();
    });

    describe('GET /api/campaigns/lookup', () => {
        it('should return product data for valid ASIN', async () => {
            const { token } = await createSellerAndLogin(app);
            fetchAsinDetailsRealTime.mockResolvedValue({
                data: { product_title: 'Mock Product', product_price: '19.99' },
            });

            const res = await request(app)
                .get('/api/campaigns/lookup?asin=B08TEST123&country=US')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('product_title', 'Mock Product');
        });

        it('should return 400 when ASIN is missing', async () => {
            const { token } = await createSellerAndLogin(app);
            const res = await request(app)
                .get('/api/campaigns/lookup')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
        });

        it('should return 404 when product not found', async () => {
            const { token } = await createSellerAndLogin(app);
            fetchAsinDetailsRealTime.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/campaigns/lookup?asin=INVALID')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/campaigns', () => {
        it('should create a campaign successfully', async () => {
            const { token } = await createSellerAndLogin(app);

            const res = await request(app)
                .post('/api/campaigns')
                .set('Authorization', `Bearer ${token}`)
                .send(defaultCampaignData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.asin).toBe(defaultCampaignData.asin);
            expect(res.body.status).toBe('ACTIVE');
        });

        it('should store optional fields correctly', async () => {
            const { token } = await createSellerAndLogin(app);

            const res = await request(app)
                .post('/api/campaigns')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...defaultCampaignData,
                    product_description: 'A great product',
                    guidelines: 'Be honest',
                    product_rating: 4.5,
                    product_rating_count: 120,
                });

            expect(res.status).toBe(201);
            expect(res.body.product_description).toBe('A great product');
            expect(res.body.guidelines).toBe('Be honest');
            expect(parseFloat(res.body.product_rating)).toBe(4.5);
            expect(res.body.product_rating_count).toBe(120);
        });

        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .post('/api/campaigns')
                .send(defaultCampaignData);

            expect([401, 403]).toContain(res.status);
        });

        it('should return 403 for buyer role', async () => {
            const { token } = await createBuyerAndLogin(app);

            const res = await request(app)
                .post('/api/campaigns')
                .set('Authorization', `Bearer ${token}`)
                .send(defaultCampaignData);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/campaigns', () => {
        it('should return paginated campaigns for seller', async () => {
            const { token } = await createSellerAndLogin(app);
            await createCampaignViaAPI(app, token);
            await createCampaignViaAPI(app, token);

            const res = await request(app)
                .get('/api/campaigns')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination.total).toBe(2);
        });

        it('should return empty list for seller with no campaigns', async () => {
            const { token } = await createSellerAndLogin(app);

            const res = await request(app)
                .get('/api/campaigns')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
            expect(res.body.pagination.total).toBe(0);
        });

        it('should enforce seller isolation', async () => {
            const seller1 = await createSellerAndLogin(app);
            const seller2 = await createSellerAndLogin(app);

            await createCampaignViaAPI(app, seller1.token);
            await createCampaignViaAPI(app, seller2.token);

            const res = await request(app)
                .get('/api/campaigns')
                .set('Authorization', `Bearer ${seller1.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should paginate correctly', async () => {
            const { token } = await createSellerAndLogin(app);
            for (let i = 0; i < 3; i++) {
                await createCampaignViaAPI(app, token);
            }

            const res = await request(app)
                .get('/api/campaigns?page=1&limit=2')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination.total).toBe(3);
        });

        it('should return 401 without auth', async () => {
            const res = await request(app).get('/api/campaigns');
            expect([401, 403]).toContain(res.status);
        });
    });

    describe('GET /api/campaigns/:id', () => {
        it('should return campaign details for owner', async () => {
            const { token } = await createSellerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, token);

            const res = await request(app)
                .get(`/api/campaigns/${campaign.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(campaign.id);
        });

        it('should return 404 for non-existent campaign', async () => {
            const { token } = await createSellerAndLogin(app);

            const res = await request(app)
                .get('/api/campaigns/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('should return 404 when accessing another sellers campaign', async () => {
            const seller1 = await createSellerAndLogin(app);
            const seller2 = await createSellerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller1.token);

            const res = await request(app)
                .get(`/api/campaigns/${campaign.id}`)
                .set('Authorization', `Bearer ${seller2.token}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/campaigns/:id/status', () => {
        it('should toggle ACTIVE to PAUSED', async () => {
            const { token } = await createSellerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, token);

            const res = await request(app)
                .patch(`/api/campaigns/${campaign.id}/status`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('PAUSED');
        });

        it('should toggle PAUSED back to ACTIVE', async () => {
            const { token } = await createSellerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, token);

            // First toggle: ACTIVE -> PAUSED
            await request(app)
                .patch(`/api/campaigns/${campaign.id}/status`)
                .set('Authorization', `Bearer ${token}`);

            // Second toggle: PAUSED -> ACTIVE
            const res = await request(app)
                .patch(`/api/campaigns/${campaign.id}/status`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ACTIVE');
        });

        it('should return 404 for another sellers campaign', async () => {
            const seller1 = await createSellerAndLogin(app);
            const seller2 = await createSellerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller1.token);

            const res = await request(app)
                .patch(`/api/campaigns/${campaign.id}/status`)
                .set('Authorization', `Bearer ${seller2.token}`);

            expect(res.status).toBe(404);
        });

        it('should return 404 for non-existent campaign', async () => {
            const { token } = await createSellerAndLogin(app);

            const res = await request(app)
                .patch('/api/campaigns/00000000-0000-0000-0000-000000000000/status')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });
});
