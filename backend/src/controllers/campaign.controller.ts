import { Request, Response } from 'express';
import { Sequelize } from 'sequelize';
import { fetchAsinDetailsRealTime } from '../services/amazon.service';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { OrderClaim, ReviewStatus } from '../models/OrderClaim';
import { SellerProfile } from '../models/SellerProfile';
import { logger } from '../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';

export const lookupAsin = async (req: Request, res: Response) => {
    try {
        const asin = req.query.asin as string;
        const country = (req.query.country as string) || 'US';

        if (!asin) {
            return res.status(400).json({ message: 'ASIN is required' });
        }

        const details = await fetchAsinDetailsRealTime(asin, country);
        if (!details) {
            return res.status(404).json({ message: 'Product details not found or failed to fetch' });
        }

        const data = details.data as Record<string, unknown> | undefined;

        // Validate the response has actual product data (not empty/null from wrong region or invalid ASIN)
        if (!data || !data.product_title || !data.asin) {
            return res.status(404).json({
                message: 'Product not found in the selected marketplace. Please verify the ASIN and region.',
                code: 'PRODUCT_NOT_FOUND_IN_REGION',
            });
        }

        // Validate price - reject products with $0 price (corrupted data)
        const priceStr = (data.product_price as string) || '';
        const priceCleaned = priceStr.replace(/[^0-9.,]/g, '').replace(/,(\d{2})$/, '.$1').replace(/,/g, '');
        const price = parseFloat(priceCleaned) || 0;
        if (price <= 0) {
            return res.status(422).json({
                message: 'Product data appears incomplete or corrupted — price is unavailable. Please try again or use a different ASIN.',
                code: 'INVALID_PRODUCT_DATA',
            });
        }

        logger.debug(`RapidAPI ASIN Lookup Details: ${JSON.stringify(data, null, 2)}`);

        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Error looking up ASIN: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching ASIN details' });
    }
};

export const createCampaign = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.userId;
        if (!user_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const sellerProfile = await SellerProfile.findOne({ where: { user_id } });
        if (!sellerProfile) {
            return res.status(403).json({ message: 'Seller profile not found' });
        }

        const {
            asin,
            region,
            category,
            product_title,
            product_image_url,
            product_description,
            product_price,
            product_rating,
            product_rating_count,
            target_reviews,
            reimbursement_percent,
            guidelines
        } = req.body;

        const campaign = await Campaign.create({
            seller_id: sellerProfile.id,
            asin,
            region,
            category,
            product_title,
            product_image_url,
            product_description,
            product_price,
            product_rating: product_rating ?? null,
            product_rating_count: product_rating_count ?? null,
            target_reviews,
            reimbursement_percent,
            guidelines,
            status: CampaignStatus.ACTIVE
        });

        return res.status(201).json(campaign);
    } catch (error) {
        logger.error(`Error creating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while creating campaign' });
    }
};

export const getCampaigns = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.userId;
        if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

        const sellerProfile = await SellerProfile.findOne({ where: { user_id } });
        if (!sellerProfile) return res.status(403).json({ message: 'Seller profile not found' });

        const pagination = parsePaginationParams(req.query, 12);

        const { count, rows } = await Campaign.findAndCountAll({
            where: { seller_id: sellerProfile.id },
            order: [['created_at', 'DESC']],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        // Compute claimed_count (approved reviews) in a single query
        const campaignIds = rows.map(c => c.id);
        const claimedCounts = campaignIds.length > 0
            ? await OrderClaim.findAll({
                where: { campaign_id: campaignIds, review_status: ReviewStatus.APPROVED },
                attributes: ['campaign_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['campaign_id'],
                raw: true,
            }) as unknown as { campaign_id: string; count: string }[]
            : [];
        const countMap = new Map(claimedCounts.map(r => [r.campaign_id, parseInt(r.count, 10)]));

        const campaignsWithCounts = rows.map(campaign => ({
            ...campaign.toJSON(),
            claimed_count: countMap.get(campaign.id) || 0,
        }));

        return res.status(200).json(buildPaginatedResponse(campaignsWithCounts, count, pagination));
    } catch (error) {
        logger.error(`Error fetching campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching campaigns' });
    }
};


export const getCampaign = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.userId;
        const { id } = req.params;

        if (!user_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const sellerProfile = await SellerProfile.findOne({ where: { user_id } });
        if (!sellerProfile) {
            return res.status(403).json({ message: 'Seller profile not found' });
        }

        const campaign = await Campaign.findOne({
            where: { id, seller_id: sellerProfile.id }
        });

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Dynamically compute claimed_count (approved reviews)
        const claimedCount = await OrderClaim.count({
            where: { campaign_id: campaign.id, review_status: ReviewStatus.APPROVED }
        });
        const json = campaign.toJSON();

        return res.status(200).json({ ...json, claimed_count: claimedCount });
    } catch (error) {
        logger.error(`Error fetching campaign details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching campaign details' });
    }
};

export const toggleCampaignStatus = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.userId;
        const { id } = req.params;

        if (!user_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const sellerProfile = await SellerProfile.findOne({ where: { user_id } });
        if (!sellerProfile) {
            return res.status(403).json({ message: 'Seller profile not found' });
        }

        const campaign = await Campaign.findOne({
            where: { id, seller_id: sellerProfile.id }
        });

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        campaign.status = campaign.status === CampaignStatus.ACTIVE
            ? CampaignStatus.PAUSED
            : CampaignStatus.ACTIVE;

        await campaign.save();

        const claimedCount = await OrderClaim.count({
            where: { campaign_id: campaign.id, review_status: ReviewStatus.APPROVED }
        });

        return res.status(200).json({ ...campaign.toJSON(), claimed_count: claimedCount });
    } catch (error) {
        logger.error(`Error toggling campaign status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while toggling campaign status' });
    }
};
