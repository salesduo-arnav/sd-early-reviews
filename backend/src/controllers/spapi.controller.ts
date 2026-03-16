import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SellerProfile } from '../models/SellerProfile';
import { logger } from '../utils/logger';
import { clearTokenCache } from '../services/spapi';

const APP_ID = process.env.AMZN_SP_APP_ID || '';
const REDIRECT_URI = process.env.AMZN_SP_REDIRECT_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

interface SpapiStatePayload {
    userId: string;
    sellerId: string;
    purpose: string;
}

/**
 * GET /api/spapi/auth-url
 * Generate the Amazon SP-API OAuth authorization URL for the seller.
 */
export const getSpapiAuthUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const sellerProfile = await SellerProfile.findOne({ where: { user_id: userId } });
        if (!sellerProfile) {
            res.status(404).json({ message: 'Seller profile not found. Complete onboarding first.' });
            return;
        }

        // Generate a signed state token (CSRF protection)
        const state = jwt.sign(
            { userId, sellerId: sellerProfile.id, purpose: 'spapi_oauth' } as SpapiStatePayload,
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        const authUrl = `https://sellercentral.amazon.com/apps/authorize/consent?application_id=${encodeURIComponent(APP_ID)}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

        res.status(200).json({ authUrl });
    } catch (error) {
        logger.error('Error generating SP-API auth URL', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * GET /api/spapi/status
 * Get the seller's SP-API authorization status.
 */
export const getSpapiStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const sellerProfile = await SellerProfile.findOne({ where: { user_id: userId } });
        if (!sellerProfile) {
            res.status(404).json({ message: 'Seller profile not found' });
            return;
        }

        res.status(200).json({
            authorized: sellerProfile.amzn_authorization_status === 'AUTHORIZED',
            authorizedAt: sellerProfile.amzn_authorized_at || null,
            sellingPartnerId: sellerProfile.amzn_selling_partner_id || null,
        });
    } catch (error) {
        logger.error('Error getting SP-API status', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * POST /api/spapi/revoke
 * Revoke the seller's SP-API authorization.
 */
export const revokeSpapiAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const sellerProfile = await SellerProfile.findOne({ where: { user_id: userId } });
        if (!sellerProfile) {
            res.status(404).json({ message: 'Seller profile not found' });
            return;
        }

        await sellerProfile.update({
            amzn_refresh_token_encrypted: undefined,
            amzn_refresh_token_iv: undefined,
            amzn_refresh_token_tag: undefined,
            amzn_authorization_status: 'REVOKED',
        });

        clearTokenCache(sellerProfile.id);

        res.status(200).json({ message: 'SP-API authorization revoked' });
    } catch (error) {
        logger.error('Error revoking SP-API auth', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
