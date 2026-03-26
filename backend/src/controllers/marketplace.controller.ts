import { Request, Response } from 'express';
import { Op, WhereOptions, Order, literal } from 'sequelize';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { SellerProfile } from '../models/SellerProfile';
import { OrderClaim } from '../models/OrderClaim';
import { BuyerProfile } from '../models/BuyerProfile';
import { logger, formatError } from '../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { notificationService } from '../services/notification.service';
import { NotificationCategory } from '../models/Notification';
import { attemptAutoVerification } from '../services/verification';
import { getMarketplace } from '../config/marketplaces';

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

        // Exclude campaigns the buyer has already claimed
        const userId = req.user?.userId;
        if (userId) {
            const buyerProfile = await BuyerProfile.findOne({ where: { user_id: userId }, attributes: ['id'] });
            if (buyerProfile) {
                const claimedCampaignIds = (await OrderClaim.findAll({
                    where: { buyer_id: buyerProfile.id },
                    attributes: ['campaign_id'],
                    raw: true,
                })).map(c => c.campaign_id);

                if (claimedCampaignIds.length > 0) {
                    (where as Record<string, unknown>).id = { [Op.notIn]: claimedCampaignIds };
                }
            }
        }

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
            order = [[literal('(SELECT COUNT(*) FROM order_claims WHERE order_claims.campaign_id = "Campaign".id AND order_claims.deleted_at IS NULL)'), 'DESC']];
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

        // Count active claims per campaign to derive slot availability
        const campaignIds = rows.map((c) => c.id);
        const claimCounts = await OrderClaim.count({
            where: { campaign_id: campaignIds },
            group: ['campaign_id'],
        });
        const claimCountMap = new Map(
            (claimCounts as unknown as { campaign_id: string; count: number }[]).map(
                (c) => [c.campaign_id, Number(c.count)]
            )
        );

        // Map to marketplace-friendly shape
        const products = rows.map((campaign) => {
            const raw = campaign.toJSON() as unknown as Record<string, unknown>;
            const seller = raw.SellerProfile as Record<string, unknown> | undefined;
            const activeClaims = claimCountMap.get(raw.id as string) || 0;

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
                reimbursement_amount: parseFloat(
                    ((Number(raw.product_price) * Number(raw.reimbursement_percent)) / 100)
                        .toFixed(getMarketplace(String(raw.region || 'US')).decimalDigits),
                ),
                region: raw.region,
                category: raw.category,
                target_reviews: raw.target_reviews,
                claimed_count: activeClaims,
                slots_remaining: Number(raw.target_reviews) - activeClaims,
                company_name: seller?.company_name as string ?? 'Unknown',
                guidelines: raw.guidelines,
                created_at: raw.created_at,
            };
        });

        return res.status(200).json(buildPaginatedResponse(products, count, pagination));
    } catch (error) {
        logger.error(`Error fetching marketplace products: ${formatError(error)}`);
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

        // Count active claims to derive slot availability
        const activeClaims = await OrderClaim.count({ where: { campaign_id: id } });

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
            claimed_count: activeClaims,
            slots_remaining: Number(raw.target_reviews) - activeClaims,
            company_name: seller?.company_name as string ?? 'Unknown',
            guidelines: raw.guidelines,
            created_at: raw.created_at,
        };

        return res.status(200).json(product);
    } catch (error) {
        logger.error(`Error fetching marketplace product: ${formatError(error)}`);
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
        logger.error(`Error fetching marketplace filters: ${formatError(error)}`);
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
                message: 'amazon_order_id, order_proof_url, and purchase_date are all required',
            });
        }

        // Validate Amazon Order ID format (e.g. 123-4567890-1234567)
        const orderIdPattern = /^\d{3}-\d{7}-\d{7}$/;
        if (!orderIdPattern.test(amazon_order_id)) {
            return res.status(400).json({
                message: 'Invalid Amazon Order ID format. Expected: 123-4567890-1234567',
            });
        }

        // Validate order_proof_url is a valid URL
        try {
            new URL(order_proof_url);
        } catch {
            return res.status(400).json({ message: 'order_proof_url must be a valid URL' });
        }

        // Validate purchase_date is a valid date and not in the future
        const parsedDate = new Date(purchase_date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'purchase_date must be a valid date' });
        }
        if (parsedDate > new Date()) {
            return res.status(400).json({ message: 'purchase_date cannot be in the future' });
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

        // Check slot availability via actual claim count
        const activeClaims = await OrderClaim.count({ where: { campaign_id: campaignId } });
        if (activeClaims >= campaign.target_reviews) {
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

        // Attempt automatic order verification
        const verificationResult = await attemptAutoVerification(claim, campaignId);
        if (verificationResult.autoVerified) {
            await claim.reload();
        }

        // Notifications (non-blocking)

        // Notify the seller about the new claim
        const sellerProfile = await SellerProfile.findByPk(campaign.seller_id);
        if (sellerProfile) {
            notificationService.send(sellerProfile.user_id, NotificationCategory.NEW_ORDER_CLAIM, {
                message: `A buyer has claimed "${campaign.product_title}" (Order: ${amazon_order_id}). Review their order proof in your dashboard.`,
                actionLink: `/seller/campaigns/${campaignId}`,
            }).catch((err) => logger.error('Failed to send NEW_ORDER_CLAIM notification', { err }));
        }

        // Notify the buyer with confirmation (only if not auto-verified, since auto-verify sends its own notification)
        if (!verificationResult.autoVerified) {
            notificationService.send(userId, NotificationCategory.ORDER_APPROVED, {
                title: 'Claim Submitted',
                message: `Your claim for "${campaign.product_title}" has been submitted and is pending verification.`,
                actionLink: '/buyer/claims',
            }).catch((err) => logger.error('Failed to send claim confirmation notification', { err }));
        }

        return res.status(201).json({
            message: verificationResult.autoVerified
                ? 'Product claimed and order verified automatically'
                : 'Product claimed successfully',
            claim,
        });
    } catch (error) {
        logger.error(`Error claiming product: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error while claiming product' });
    }
};
