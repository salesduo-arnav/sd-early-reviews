import request from 'supertest';
import app from '../app';
import sequelize from '../config/db';
import { SystemConfig } from '../models/SystemConfig';

jest.mock('../services/mail.service', () => ({
    mailService: { sendMail: jest.fn().mockResolvedValue(true) },
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

describe('Config API', () => {
    beforeEach(async () => {
        await SystemConfig.destroy({ where: {} });
        jest.clearAllMocks();
    });

    describe('GET /api/config', () => {
        it('should return config as key-value map', async () => {
            await SystemConfig.create({ key: 'platform_fee', value: '10' });
            await SystemConfig.create({ key: 'min_reviews', value: '5' });

            const res = await request(app).get('/api/config');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                platform_fee: '10',
                min_reviews: '5',
            });
        });

        it('should return empty object when no configs exist', async () => {
            const res = await request(app).get('/api/config');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({});
        });
    });

    describe('PATCH /api/config/:key', () => {
        it('should create a new config value', async () => {
            const res = await request(app)
                .patch('/api/config/new_key')
                .send({ value: 'new_value' });

            expect([200, 201]).toContain(res.status);
            expect(res.body.key).toBe('new_key');
            expect(res.body.value).toBe('new_value');
        });

        it('should update an existing config value', async () => {
            await SystemConfig.create({ key: 'existing_key', value: 'old_value' });

            const res = await request(app)
                .patch('/api/config/existing_key')
                .send({ value: 'updated_value' });

            expect(res.status).toBe(200);
            expect(res.body.value).toBe('updated_value');
        });

        it('should return 400 when value is missing', async () => {
            const res = await request(app)
                .patch('/api/config/some_key')
                .send({});

            expect(res.status).toBe(400);
        });
    });
});
