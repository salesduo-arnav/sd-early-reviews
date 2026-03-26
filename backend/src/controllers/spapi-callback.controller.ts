import { Request, Response } from 'express';
import { SellerProfile } from '../models/SellerProfile';
import { logger } from '../utils/logger';
import { SPAPI_AUTH_STATUS } from '../utils/constants';
import { verifyToken } from '../utils/jwt';
import { encryptToken } from '../utils/encryption';
import { exchangeCodeForTokens } from '../services/spapi';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface SpapiStatePayload {
    userId: string;
    sellerId: string;
    purpose: string;
}

/**
 * GET /callback
 * OAuth callback handler for Amazon SP-API authorization.
 * Mounted at root level (not under /api) to match the SP-API redirect URI.
 */
export const spapiCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { spapi_oauth_code, selling_partner_id, state } = req.query;

        // Validate required params
        if (!spapi_oauth_code || !selling_partner_id || !state) {
            logger.warn('SP-API callback missing required params', { query: req.query });
            res.redirect(`${FRONTEND_URL}/spapi-callback?spapi=error&reason=missing_params`);
            return;
        }

        // Validate state JWT (CSRF protection)
        let statePayload: SpapiStatePayload;
        try {
            statePayload = verifyToken<SpapiStatePayload>(state as string);
            if (statePayload.purpose !== 'spapi_oauth') {
                throw new Error('Invalid state purpose');
            }
        } catch {
            logger.warn('SP-API callback invalid state token');
            res.redirect(`${FRONTEND_URL}/spapi-callback?spapi=error&reason=invalid_state`);
            return;
        }

        // Find the seller profile
        const sellerProfile = await SellerProfile.findByPk(statePayload.sellerId);
        if (!sellerProfile || sellerProfile.user_id !== statePayload.userId) {
            logger.warn('SP-API callback: seller profile not found or user mismatch');
            res.redirect(`${FRONTEND_URL}/spapi-callback?spapi=error&reason=seller_not_found`);
            return;
        }

        // Exchange the authorization code for tokens
        const tokens = await exchangeCodeForTokens(spapi_oauth_code as string);

        // Encrypt the refresh token
        const { encrypted, iv, tag } = encryptToken(tokens.refresh_token);

        // Update seller profile with SP-API credentials
        await sellerProfile.update({
            amzn_selling_partner_id: selling_partner_id as string,
            amzn_refresh_token_encrypted: encrypted,
            amzn_refresh_token_iv: iv,
            amzn_refresh_token_tag: tag,
            amzn_authorized_at: new Date(),
            amzn_authorization_status: SPAPI_AUTH_STATUS.AUTHORIZED,
        });

        logger.info('SP-API OAuth completed successfully', {
            sellerId: sellerProfile.id,
            sellingPartnerId: selling_partner_id,
        });

        res.redirect(`${FRONTEND_URL}/spapi-callback?spapi=success`);
    } catch (error) {
        logger.error('SP-API callback error', { error });
        res.redirect(`${FRONTEND_URL}/spapi-callback?spapi=error&reason=exchange_failed`);
    }
};
