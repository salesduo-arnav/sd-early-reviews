import { Request, Response } from 'express';
import { fetchAsinDetailsRealTime } from '../services/amazon.service';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { SellerProfile } from '../models/SellerProfile';
import { logger } from '../utils/logger';

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

        logger.info(`RapidAPI ASIN Lookup Details: ${JSON.stringify(details.data, null, 2)}`);

        return res.status(200).json(details.data);
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
        if (!user_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const sellerProfile = await SellerProfile.findOne({ where: { user_id } });
        if (!sellerProfile) {
            return res.status(403).json({ message: 'Seller profile not found' });
        }

        const campaigns = await Campaign.findAll({
            where: { seller_id: sellerProfile.id },
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json(campaigns);
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

        return res.status(200).json(campaign);
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

        return res.status(200).json(campaign);
    } catch (error) {
        logger.error(`Error toggling campaign status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while toggling campaign status' });
    }
};
