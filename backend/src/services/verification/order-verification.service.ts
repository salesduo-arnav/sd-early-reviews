import { OrderClaim, OrderStatus } from '../../models/OrderClaim';
import { Campaign } from '../../models/Campaign';
import { SellerProfile } from '../../models/SellerProfile';
import { SystemConfig } from '../../models/SystemConfig';
import { logger } from '../../utils/logger';
import { decryptToken } from '../../utils/encryption';
import { getAccessToken, verifyOrderBelongsToSeller, getRegionConfig, mockVerifyOrder } from '../spapi';
import { notificationService } from '../notification.service';
import { NotificationCategory } from '../../models/Notification';
import { BuyerProfile } from '../../models/BuyerProfile';

interface AutoVerificationResult {
    autoVerified: boolean;
    method: string;
}

/**
 * Attempt automatic order verification via SP-API.
 *
 * This function NEVER throws. It always returns a result.
 * On any failure, the claim stays in PENDING_VERIFICATION for manual admin review.
 */
export async function attemptAutoVerification(
    claim: OrderClaim,
    campaignId: string
): Promise<AutoVerificationResult> {
    try {
        // 1. Check if auto-verification is enabled
        const config = await SystemConfig.findByPk('auto_order_verification_enabled');
        if (!config || config.value !== 'true') {
            return { autoVerified: false, method: 'MANUAL' };
        }

        // 2. Load campaign and seller profile
        const campaign = await Campaign.findByPk(campaignId, {
            include: [{ model: SellerProfile }],
        });

        if (!campaign) {
            logger.warn('Auto-verification: campaign not found', { campaignId });
            return { autoVerified: false, method: 'MANUAL' };
        }

        const sellerProfile = (campaign as unknown as { SellerProfile: SellerProfile }).SellerProfile;
        if (!sellerProfile) {
            logger.warn('Auto-verification: seller profile not found', { campaignId });
            return { autoVerified: false, method: 'MANUAL' };
        }

        // 3. Check seller has authorized SP-API
        if (sellerProfile.amzn_authorization_status !== 'AUTHORIZED') {
            return { autoVerified: false, method: 'MANUAL' };
        }

        // 4. Check if mock mode is enabled
        const isMockMode = process.env.SP_API_MOCK_MODE === 'true';

        // 5. Resolve region config (not needed in mock mode)
        if (!isMockMode) {
            if (!sellerProfile.amzn_refresh_token_encrypted) {
                return { autoVerified: false, method: 'MANUAL' };
            }
        }

        const regionConfig = getRegionConfig(campaign.region);
        if (!regionConfig) {
            logger.warn('Auto-verification: unknown region', { region: campaign.region });
            return { autoVerified: false, method: 'MANUAL' };
        }

        let verificationResult;

        if (isMockMode) {
            verificationResult = mockVerifyOrder(claim.amazon_order_id, campaign.asin);
        } else {
            // 6. Decrypt refresh token and get access token
            const refreshToken = decryptToken(
                sellerProfile.amzn_refresh_token_encrypted,
                sellerProfile.amzn_refresh_token_iv,
                sellerProfile.amzn_refresh_token_tag
            );

            const accessToken = await getAccessToken(refreshToken, sellerProfile.id);

            // 7. Verify order via SP-API
            verificationResult = await verifyOrderBelongsToSeller(
                accessToken,
                claim.amazon_order_id,
                campaign.asin,
                regionConfig.marketplaceId,
                regionConfig.spApiRegion
            );
        }

        // 8. Store verification details regardless of outcome
        await claim.update({
            verification_details: verificationResult.rawResponse || { result: verificationResult.reason },
        });

        if (verificationResult.verified) {
            // 9. Auto-approve the claim
            await claim.update({
                order_status: OrderStatus.APPROVED,
                verification_method: 'AUTO_SP_API',
                auto_verified_at: new Date(),
            });

            // 10. Notify buyer
            const buyerProfile = await BuyerProfile.findByPk(claim.buyer_id);
            if (buyerProfile) {
                notificationService.send(buyerProfile.user_id, NotificationCategory.ORDER_APPROVED, {
                    message: `Your order for "${campaign.product_title}" has been automatically verified and approved. You can now submit your review.`,
                }).catch(err => logger.error('Failed to send auto-verification notification', { err }));
            }

            logger.info('Order auto-verified via SP-API', {
                claimId: claim.id,
                orderId: claim.amazon_order_id,
                campaignId,
            });

            return { autoVerified: true, method: 'AUTO_SP_API' };
        }

        // Verification failed but not an error -- order didn't match
        logger.info('Auto-verification failed: order did not pass checks', {
            claimId: claim.id,
            orderId: claim.amazon_order_id,
            reason: verificationResult.reason,
        });

        return { autoVerified: false, method: 'MANUAL' };

    } catch (error) {
        // Graceful fallback: any exception means manual review
        logger.warn('Auto-verification encountered an error, falling back to manual', {
            claimId: claim.id,
            orderId: claim.amazon_order_id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return { autoVerified: false, method: 'MANUAL' };
    }
}
