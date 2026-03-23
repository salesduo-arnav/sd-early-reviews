import request from 'supertest';
import app from '../app';
import sequelize from '../config/db';
import { User } from '../models/User';
import { SellerProfile } from '../models/SellerProfile';
import { BuyerProfile } from '../models/BuyerProfile';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { OrderClaim, ReviewStatus } from '../models/OrderClaim';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { Notification } from '../models/Notification';
import {
    createSellerAndLogin,
    createBuyerAndLogin,
    createCampaignViaAPI,
    createOrderClaimDirectly,
    resetCounters,
} from './helpers';
import { subDays } from 'date-fns';

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

beforeAll(async () => {
    await sequelize.authenticate();
    if (sequelize.getDatabaseName() !== 'mydb_test') {
        throw new Error('Not connected to test database');
    }
});

afterAll(async () => {
    await sequelize.close();
});

describe('Seller Dashboard API', () => {
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

    describe('GET /api/dashboard/seller/metrics', () => {
        it('should return correct metrics with data', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer = await createBuyerAndLogin(app);

            const campaign = await createCampaignViaAPI(app, seller.token);
            await createOrderClaimDirectly(campaign.id, buyer.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_date: new Date(),
            });

            await Transaction.create({
                user_id: seller.userId,
                gross_amount: 50.00,
                platform_fee: 5.00,
                net_amount: 45.00,
                type: TransactionType.SELLER_CHARGE,
                stripe_transaction_id: 'txn_test_1',
                status: TransactionStatus.SUCCESS,
            });

            const res = await request(app)
                .get('/api/dashboard/seller/metrics')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.activeCampaigns).toBe(1);
            expect(res.body.totalReviews).toBe(1);
            expect(res.body.totalSpent).toBe(50);
        });

        it('should return zeros when no data exists', async () => {
            const seller = await createSellerAndLogin(app);

            const res = await request(app)
                .get('/api/dashboard/seller/metrics')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.activeCampaigns).toBe(0);
            expect(res.body.totalReviews).toBe(0);
            expect(res.body.reviewChangePercent).toBe(0);
            expect(res.body.totalSpent).toBe(0);
        });

        it('should return 401 without auth', async () => {
            const res = await request(app).get('/api/dashboard/seller/metrics');
            expect([401, 403]).toContain(res.status);
        });

        it('should return 403 for buyer role', async () => {
            const buyer = await createBuyerAndLogin(app);
            const res = await request(app)
                .get('/api/dashboard/seller/metrics')
                .set('Authorization', `Bearer ${buyer.token}`);
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/dashboard/seller/velocity', () => {
        it('should return daily review counts', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            // Use a fixed date in the middle of the day to avoid timezone boundary issues
            const reviewDate = new Date();
            reviewDate.setHours(12, 0, 0, 0);

            await createOrderClaimDirectly(campaign.id, buyer.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_date: reviewDate,
            });

            const startDate = subDays(reviewDate, 6).toISOString().split('T')[0];
            const endDate = subDays(reviewDate, -1).toISOString().split('T')[0];

            const res = await request(app)
                .get(`/api/dashboard/seller/velocity?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(7);

            const totalCompleted = res.body.reduce((sum: number, d: { completed: number }) => sum + d.completed, 0);
            expect(totalCompleted).toBe(1);
        });

        it('should default to last 7 days when no dates provided', async () => {
            const seller = await createSellerAndLogin(app);

            const res = await request(app)
                .get('/api/dashboard/seller/velocity')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(7);
            res.body.forEach((d: { date: string; completed: number }) => {
                expect(d).toHaveProperty('date');
                expect(d).toHaveProperty('completed');
            });
        });

        it('should return zeros for days with no reviews', async () => {
            const seller = await createSellerAndLogin(app);

            const res = await request(app)
                .get('/api/dashboard/seller/velocity')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            const allZero = res.body.every((d: { completed: number }) => d.completed === 0);
            expect(allZero).toBe(true);
        });
    });

    describe('GET /api/dashboard/seller/campaign-progress', () => {
        it('should return campaigns with completed review counts', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            await createOrderClaimDirectly(campaign.id, buyer.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
            });

            const res = await request(app)
                .get('/api/dashboard/seller/campaign-progress')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].completed).toBe(1);
            expect(res.body.data[0].target).toBe(10);
        });

        it('should not include COMPLETED campaigns', async () => {
            const seller = await createSellerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            // Directly set status to COMPLETED
            await Campaign.update({ status: CampaignStatus.COMPLETED }, { where: { id: campaign.id } });

            const res = await request(app)
                .get('/api/dashboard/seller/campaign-progress')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });

        it('should paginate correctly', async () => {
            const seller = await createSellerAndLogin(app);
            await Promise.all(Array.from({ length: 8 }, () => createCampaignViaAPI(app, seller.token)));

            const res = await request(app)
                .get('/api/dashboard/seller/campaign-progress?page=1&limit=5')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(5);
            expect(res.body.pagination.total).toBe(8);
        });
    });

    describe('GET /api/dashboard/seller/reviews/stats', () => {
        it('should return correct review statistics', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer1 = await createBuyerAndLogin(app);
            const buyer2 = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            await createOrderClaimDirectly(campaign.id, buyer1.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_rating: 5,
            });
            await createOrderClaimDirectly(campaign.id, buyer2.buyerProfileId, {
                review_status: ReviewStatus.PENDING_VERIFICATION,
                review_rating: 3,
            });

            const res = await request(app)
                .get('/api/dashboard/seller/reviews/stats')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.totalReviews).toBe(2);
            expect(res.body.approvedReviews).toBe(1);
            expect(res.body.pendingReviews).toBe(1);
            expect(res.body.averageRating).toBe(4.0);
        });

        it('should return 0 average when no ratings exist', async () => {
            const seller = await createSellerAndLogin(app);

            const res = await request(app)
                .get('/api/dashboard/seller/reviews/stats')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.averageRating).toBe(0);
            expect(res.body.totalReviews).toBe(0);
        });
    });

    describe('GET /api/dashboard/seller/reviews', () => {
        it('should return reviews with campaign data', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            await createOrderClaimDirectly(campaign.id, buyer.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_text: 'Amazing product',
                review_rating: 5,
            });

            const res = await request(app)
                .get('/api/dashboard/seller/reviews')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0]).toHaveProperty('asin');
            expect(res.body.data[0]).toHaveProperty('product_title');
            expect(res.body.data[0].review_text).toBe('Amazing product');
        });

        it('should filter by status', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer1 = await createBuyerAndLogin(app);
            const buyer2 = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            await createOrderClaimDirectly(campaign.id, buyer1.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
            });
            await createOrderClaimDirectly(campaign.id, buyer2.buyerProfileId, {
                review_status: ReviewStatus.PENDING_VERIFICATION,
            });

            const res = await request(app)
                .get('/api/dashboard/seller/reviews?status=APPROVED')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].review_status).toBe('APPROVED');
        });

        it('should filter by rating', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer1 = await createBuyerAndLogin(app);
            const buyer2 = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            await createOrderClaimDirectly(campaign.id, buyer1.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_rating: 5,
            });
            await createOrderClaimDirectly(campaign.id, buyer2.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_rating: 3,
            });

            const res = await request(app)
                .get('/api/dashboard/seller/reviews?rating=5')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].review_rating).toBe(5);
        });

        it('should search by review text', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer1 = await createBuyerAndLogin(app);
            const buyer2 = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            await createOrderClaimDirectly(campaign.id, buyer1.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_text: 'This product is fantastic',
            });
            await createOrderClaimDirectly(campaign.id, buyer2.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_text: 'Terrible quality',
            });

            const res = await request(app)
                .get('/api/dashboard/seller/reviews?search=fantastic')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].review_text).toContain('fantastic');
        });

        it('should exclude AWAITING_UPLOAD reviews', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            await createOrderClaimDirectly(campaign.id, buyer.buyerProfileId, {
                review_status: ReviewStatus.AWAITING_UPLOAD,
            });

            const res = await request(app)
                .get('/api/dashboard/seller/reviews')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });

        it('should filter by date range', async () => {
            const seller = await createSellerAndLogin(app);
            const buyer1 = await createBuyerAndLogin(app);
            const buyer2 = await createBuyerAndLogin(app);
            const campaign = await createCampaignViaAPI(app, seller.token);

            const today = new Date();
            const thirtyDaysAgo = subDays(today, 30);

            await createOrderClaimDirectly(campaign.id, buyer1.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_date: today,
            });
            await createOrderClaimDirectly(campaign.id, buyer2.buyerProfileId, {
                review_status: ReviewStatus.APPROVED,
                review_date: thirtyDaysAgo,
            });

            const startDate = subDays(today, 2).toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];

            const res = await request(app)
                .get(`/api/dashboard/seller/reviews?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
});
