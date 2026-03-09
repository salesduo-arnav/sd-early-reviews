import { Request, Response } from 'express';
import { Op, WhereOptions, Order } from 'sequelize';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { SellerProfile } from '../models/SellerProfile';
import { OrderClaim } from '../models/OrderClaim';
import { BuyerProfile } from '../models/BuyerProfile';
import { logger } from '../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';

/**
 * GET /api/marketplace
 * Browse active campaigns available for buyers.
 * Supports: search, filters (category, region, reimbursement, price), sorting, pagination.
 */
export const getMarketplaceProducts = async (req: Request, res: Response) => {
    try {
        const pagination = parsePaginationParams(req.query, 12);

        const {
            search,
            category,
            region,
            min_price,
            max_price,
            min_reimbursement,
            max_reimbursement,
            sort,
        } = req.query;

        // Only show ACTIVE campaigns with availability
        const where: WhereOptions = {
            status: CampaignStatus.ACTIVE,
        };

        // Keyword / ASIN search
        if (search && typeof search === 'string' && search.trim()) {
            const term = search.trim();
            (where as Record<string, unknown>)[Op.or as unknown as string] = [
                { product_title: { [Op.iLike]: `%${term}%` } },
                { asin: { [Op.iLike]: `%${term}%` } },
            ];
        }

        // Category filter
        if (category && typeof category === 'string' && category.trim()) {
            (where as Record<string, unknown>).category = category.trim();
        }

        // Region filter
        if (region && typeof region === 'string' && region.trim()) {
            (where as Record<string, unknown>).region = region.trim();
        }

        // Price range filter
        if (min_price || max_price) {
            const priceFilter: Record<symbol, number> = {};
            if (min_price) priceFilter[Op.gte] = parseFloat(min_price as string);
            if (max_price) priceFilter[Op.lte] = parseFloat(max_price as string);
            (where as Record<string, unknown>).product_price = priceFilter;
        }

        // Reimbursement % range filter
        if (min_reimbursement || max_reimbursement) {
            const reimbFilter: Record<symbol, number> = {};
            if (min_reimbursement) reimbFilter[Op.gte] = parseFloat(min_reimbursement as string);
            if (max_reimbursement) reimbFilter[Op.lte] = parseFloat(max_reimbursement as string);
            (where as Record<string, unknown>).reimbursement_percent = reimbFilter;
        }

        // Sorting
        let order: Order = [['created_at', 'DESC']]; // default: newest
        if (sort === 'reimbursement') {
            order = [['reimbursement_percent', 'DESC']];
        } else if (sort === 'popular') {
            order = [['claimed_count', 'DESC']];
        } else if (sort === 'price_low') {
            order = [['product_price', 'ASC']];
        } else if (sort === 'price_high') {
            order = [['product_price', 'DESC']];
        }

        const { count, rows } = await Campaign.findAndCountAll({
            where,
            order,
            limit: pagination.limit,
            offset: pagination.offset,
            include: [
                {
                    model: SellerProfile,
                    attributes: ['id', 'company_name'],
                },
            ],
        });

        // Map to marketplace-friendly shape
        const products = rows.map((campaign) => {
            const raw = campaign.toJSON() as unknown as Record<string, unknown>;
            const seller = raw.SellerProfile as Record<string, unknown> | undefined;


            return {
                id: raw.id,
                campaign_id: raw.id,
                asin: raw.asin,
                title: raw.product_title,
                description: raw.product_description,
                image_url: raw.product_image_url,
                price: raw.product_price,
                rating: raw.product_rating,
                rating_count: raw.product_rating_count,
                reimbursement_pct: raw.reimbursement_percent,
                reimbursement_amount: (
                    (Number(raw.product_price) * Number(raw.reimbursement_percent)) / 100
                ).toFixed(2),
                region: raw.region,
                category: raw.category,
                target_reviews: raw.target_reviews,
                claimed_count: raw.claimed_count,
                slots_remaining: Number(raw.target_reviews) - Number(raw.claimed_count),
                company_name: seller?.company_name as string ?? 'Unknown',
                guidelines: raw.guidelines,
                created_at: raw.created_at,
            };
        });

        return res.status(200).json(buildPaginatedResponse(products, count, pagination));
    } catch (error) {
        logger.error(`Error fetching marketplace products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching marketplace products' });
    }
};

/**
 * GET /api/marketplace/:id
 * Get single product detail for buyer view.
 */
export const getMarketplaceProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await Campaign.findOne({
            where: { id, status: CampaignStatus.ACTIVE },
            include: [
                {
                    model: SellerProfile,
                    attributes: ['id', 'company_name'],
                },
            ],
        });

        if (!campaign) {
            return res.status(404).json({ message: 'Product not found or no longer available' });
        }

        const raw = campaign.toJSON() as unknown as Record<string, unknown>;
        const seller = raw.SellerProfile as Record<string, unknown> | undefined;

        const product = {
            id: raw.id,
            campaign_id: raw.id,
            asin: raw.asin,
            title: raw.product_title,
            description: raw.product_description,
            image_url: raw.product_image_url,
            price: raw.product_price,
            rating: raw.product_rating,
            rating_count: raw.product_rating_count,
            reimbursement_pct: raw.reimbursement_percent,
            reimbursement_amount: (
                (Number(raw.product_price) * Number(raw.reimbursement_percent)) / 100
            ).toFixed(2),
            region: raw.region,
            category: raw.category,
            target_reviews: raw.target_reviews,
            claimed_count: raw.claimed_count,
            slots_remaining: Number(raw.target_reviews) - Number(raw.claimed_count),
            company_name: seller?.company_name as string ?? 'Unknown',
            guidelines: raw.guidelines,
            created_at: raw.created_at,
        };

        return res.status(200).json(product);
    } catch (error) {
        logger.error(`Error fetching marketplace product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching product details' });
    }
};

/**
 * GET /api/marketplace/filters
 * Returns distinct categories and regions from active campaigns for filter dropdowns.
 */
export const getMarketplaceFilters = async (_req: Request, res: Response) => {
    try {
        const activeWhere = { status: CampaignStatus.ACTIVE };

        const [categories, regions] = await Promise.all([
            Campaign.findAll({
                where: activeWhere,
                attributes: ['category'],
                group: ['category'],
                raw: true,
            }),
            Campaign.findAll({
                where: activeWhere,
                attributes: ['region'],
                group: ['region'],
                raw: true,
            }),
        ]);

        return res.status(200).json({
            categories: categories.map((c) => (c as unknown as Record<string, string>).category).filter(Boolean),
            regions: regions.map((r) => (r as unknown as Record<string, string>).region).filter(Boolean),
        });
    } catch (error) {
        logger.error(`Error fetching marketplace filters: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching filters' });
    }
};

/**
 * POST /api/marketplace/:id/claim
 * Buyer claims a product by submitting order details and proof.
 */
export const claimProduct = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const campaignId = req.params.id;
        const { amazon_order_id, order_proof_url, purchase_date } = req.body;

        // Validate required fields
        if (!amazon_order_id || !order_proof_url || !purchase_date) {
            return res.status(400).json({
                message: 'amazon_order_id, order_proof_url, and purchase_date are required',
            });
        }

        // Get buyer profile
        const buyerProfile = await BuyerProfile.findOne({ where: { user_id: userId } });
        if (!buyerProfile) {
            return res.status(403).json({ message: 'Buyer profile not found. Complete onboarding first.' });
        }

        if (buyerProfile.is_blacklisted) {
            return res.status(403).json({ message: 'Your account has been restricted. Contact support.' });
        }

        // Get the campaign
        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        if (campaign.status !== CampaignStatus.ACTIVE) {
            return res.status(400).json({ message: 'This campaign is no longer accepting claims' });
        }

        // Check availability
        if (campaign.claimed_count >= campaign.target_reviews) {
            return res.status(400).json({ message: 'All slots for this product have been claimed' });
        }

        // Check if buyer already claimed this campaign
        const existingClaim = await OrderClaim.findOne({
            where: { campaign_id: campaignId, buyer_id: buyerProfile.id },
        });
        if (existingClaim) {
            return res.status(409).json({ message: 'You have already claimed this product' });
        }

        // Check if amazon_order_id is already used
        const duplicateOrder = await OrderClaim.findOne({
            where: { amazon_order_id },
        });
        if (duplicateOrder) {
            return res.status(409).json({ message: 'This Amazon order ID has already been used for another claim' });
        }

        // Calculate expected payout
        const expectedPayout = (Number(campaign.product_price) * campaign.reimbursement_percent) / 100;

        // Set review deadline (14 days from now)
        const reviewDeadline = new Date();
        reviewDeadline.setDate(reviewDeadline.getDate() + 14);

        // Create the claim
        const claim = await OrderClaim.create({
            campaign_id: campaignId,
            buyer_id: buyerProfile.id,
            amazon_order_id,
            order_proof_url,
            purchase_date: new Date(purchase_date),
            expected_payout_amount: expectedPayout,
            review_deadline: reviewDeadline,
        });

        // Increment claimed_count on campaign
        await campaign.increment('claimed_count');

        // Auto-complete campaign if all slots filled
        if (campaign.claimed_count + 1 >= campaign.target_reviews) {
            campaign.status = CampaignStatus.COMPLETED;
            await campaign.save();
        }

        return res.status(201).json({
            message: 'Product claimed successfully',
            claim,
        });
    } catch (error) {
        logger.error(`Error claiming product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while claiming product' });
    }
};
