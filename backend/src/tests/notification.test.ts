import request from 'supertest';
import app from '../app';
import sequelize from '../config/db';
import { User } from '../models/User';
import { SellerProfile } from '../models/SellerProfile';
import { BuyerProfile } from '../models/BuyerProfile';
import { Campaign } from '../models/Campaign';
import { OrderClaim } from '../models/OrderClaim';
import { Transaction } from '../models/Transaction';
import { Notification, NotificationCategory, NotificationPriority } from '../models/Notification';
import { createSellerAndLogin, resetCounters } from './helpers';

jest.mock('../services/mail.service', () => ({
    mailService: { sendMail: jest.fn().mockResolvedValue(true) },
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

async function seedNotifications(userId: string, count: number, isRead = false) {
    const notifications = [];
    for (let i = 0; i < count; i++) {
        notifications.push(
            await Notification.create({
                user_id: userId,
                category: NotificationCategory.SYSTEM_ANNOUNCEMENT,
                priority: NotificationPriority.LOW,
                title: `Notification ${i + 1}`,
                message: `Message ${i + 1}`,
                is_read: isRead,
            })
        );
    }
    return notifications;
}

describe('Notification API', () => {
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

    describe('GET /api/notifications', () => {
        it('should return notifications for authenticated user', async () => {
            const seller = await createSellerAndLogin(app);
            await seedNotifications(seller.userId, 3);

            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            // Account for the welcome notification created during signup
            expect(res.body.notifications.length).toBeGreaterThanOrEqual(3);
        });

        it('should return empty array for user with no notifications', async () => {
            const seller = await createSellerAndLogin(app);
            // Delete all notifications including the welcome one
            await Notification.destroy({ where: { user_id: seller.userId }, force: true });

            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.notifications).toHaveLength(0);
        });

        it('should respect limit query param', async () => {
            const seller = await createSellerAndLogin(app);
            await Notification.destroy({ where: { user_id: seller.userId }, force: true });
            await seedNotifications(seller.userId, 5);

            const res = await request(app)
                .get('/api/notifications?limit=2')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.notifications).toHaveLength(2);
        });

        it('should return 401 without auth', async () => {
            const res = await request(app).get('/api/notifications');
            expect([401, 403]).toContain(res.status);
        });
    });

    describe('GET /api/notifications/unread-count', () => {
        it('should return correct unread count', async () => {
            const seller = await createSellerAndLogin(app);
            await Notification.destroy({ where: { user_id: seller.userId }, force: true });
            await seedNotifications(seller.userId, 3, false);
            await seedNotifications(seller.userId, 2, true);

            const res = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.unreadCount).toBe(3);
        });

        it('should return 0 when all notifications are read', async () => {
            const seller = await createSellerAndLogin(app);
            await Notification.destroy({ where: { user_id: seller.userId }, force: true });
            await seedNotifications(seller.userId, 3, true);

            const res = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.unreadCount).toBe(0);
        });
    });

    describe('PATCH /api/notifications/:id/read', () => {
        it('should mark a notification as read', async () => {
            const seller = await createSellerAndLogin(app);
            await Notification.destroy({ where: { user_id: seller.userId }, force: true });
            const [notification] = await seedNotifications(seller.userId, 1);

            const res = await request(app)
                .patch(`/api/notifications/${notification.id}/read`)
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);

            const updated = await Notification.findByPk(notification.id);
            expect(updated?.is_read).toBe(true);
        });

        it('should return 404 for another users notification', async () => {
            const seller1 = await createSellerAndLogin(app);
            const seller2 = await createSellerAndLogin(app);
            await Notification.destroy({ where: { user_id: seller1.userId }, force: true });
            const [notification] = await seedNotifications(seller1.userId, 1);

            const res = await request(app)
                .patch(`/api/notifications/${notification.id}/read`)
                .set('Authorization', `Bearer ${seller2.token}`);

            expect(res.status).toBe(404);
        });

        it('should return 404 for non-existent notification', async () => {
            const seller = await createSellerAndLogin(app);

            const res = await request(app)
                .patch('/api/notifications/00000000-0000-0000-0000-000000000000/read')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/notifications/read-all', () => {
        it('should mark all notifications as read', async () => {
            const seller = await createSellerAndLogin(app);
            await Notification.destroy({ where: { user_id: seller.userId }, force: true });
            await seedNotifications(seller.userId, 3, false);

            const res = await request(app)
                .patch('/api/notifications/read-all')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('3');

            const unread = await Notification.count({
                where: { user_id: seller.userId, is_read: false },
            });
            expect(unread).toBe(0);
        });

        it('should return 0 count when none are unread', async () => {
            const seller = await createSellerAndLogin(app);
            await Notification.destroy({ where: { user_id: seller.userId }, force: true });
            await seedNotifications(seller.userId, 2, true);

            const res = await request(app)
                .patch('/api/notifications/read-all')
                .set('Authorization', `Bearer ${seller.token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('0');
        });
    });
});
