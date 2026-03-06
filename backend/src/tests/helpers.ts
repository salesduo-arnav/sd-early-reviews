import request from 'supertest';
import { Express } from 'express';
import { User, UserRole } from '../models/User';
import { SellerProfile } from '../models/SellerProfile';
import { BuyerProfile } from '../models/BuyerProfile';
import { OrderClaim, ReviewStatus, OrderStatus, PayoutStatus } from '../models/OrderClaim';

let sellerCounter = 0;
let buyerCounter = 0;

export async function createSellerAndLogin(app: Express) {
    sellerCounter++;
    const email = `seller${sellerCounter}@test.com`;
    const password = 'Password123!';

    await request(app).post('/api/auth/signup').send({
        full_name: `Test Seller ${sellerCounter}`,
        email,
        password,
        role: UserRole.SELLER,
    });

    await User.update({ is_verified: true }, { where: { email } });

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    const token = loginRes.body.tokens.accessToken;
    const user = await User.findOne({ where: { email } });
    const sellerProfile = await SellerProfile.findOne({ where: { user_id: user!.id } });

    return { token, userId: user!.id, sellerProfileId: sellerProfile!.id };
}

export async function createBuyerAndLogin(app: Express) {
    buyerCounter++;
    const email = `buyer${buyerCounter}@test.com`;
    const password = 'Password123!';

    await request(app).post('/api/auth/signup').send({
        full_name: `Test Buyer ${buyerCounter}`,
        email,
        password,
        role: UserRole.BUYER,
        amazon_profile_url: `https://amazon.com/profile/buyer${buyerCounter}`,
        region: 'US',
    });

    await User.update({ is_verified: true }, { where: { email } });

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    const token = loginRes.body.tokens.accessToken;
    const user = await User.findOne({ where: { email } });
    const buyerProfile = await BuyerProfile.findOne({ where: { user_id: user!.id } });

    return { token, userId: user!.id, buyerProfileId: buyerProfile!.id };
}

let campaignCounter = 0;

export const defaultCampaignData = {
    asin: 'B08N5WRWNW',
    region: 'US',
    category: 'Electronics',
    product_title: 'Test Product',
    product_image_url: 'https://example.com/image.jpg',
    product_price: 29.99,
    target_reviews: 10,
    reimbursement_percent: 100,
};

export async function createCampaignViaAPI(app: Express, token: string, overrides: Record<string, unknown> = {}) {
    campaignCounter++;
    const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...defaultCampaignData, product_title: `Test Product ${campaignCounter}`, ...overrides });
    return res.body;
}

export async function createOrderClaimDirectly(
    campaignId: string,
    buyerProfileId: string,
    overrides: Partial<{
        review_status: ReviewStatus;
        review_rating: number;
        review_text: string;
        review_date: Date;
        amazon_order_id: string;
        expected_payout_amount: number;
    }> = {}
) {
    const orderId = overrides.amazon_order_id || `AMZ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return OrderClaim.create({
        campaign_id: campaignId,
        buyer_id: buyerProfileId,
        expected_payout_amount: overrides.expected_payout_amount ?? 29.99,
        amazon_order_id: orderId,
        order_proof_url: 'https://example.com/proof.jpg',
        purchase_date: new Date(),
        order_status: OrderStatus.APPROVED,
        review_status: overrides.review_status ?? ReviewStatus.APPROVED,
        review_rating: overrides.review_rating ?? 5,
        review_text: overrides.review_text ?? 'Great product!',
        review_date: overrides.review_date ?? new Date(),
        payout_status: PayoutStatus.NOT_ELIGIBLE,
    });
}

export function resetCounters() {
    sellerCounter = 0;
    buyerCounter = 0;
    campaignCounter = 0;
}
