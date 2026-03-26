import { OrderClaim, PayoutStatus } from '../models/OrderClaim';
import { Campaign } from '../models/Campaign';
import { BuyerProfile } from '../models/BuyerProfile';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { sendPayout, regionToCurrency } from './wise.service';
import { formatAmountWithCurrency } from '../config/marketplaces';
import { toUSD } from './exchange-rate.service';
import { notificationService } from './notification.service';
import { NotificationCategory } from '../models/Notification';
import { logAdminAction } from '../utils/auditLog';
import { ADMIN_ACTIONS } from '../utils/constants';
import { logger } from '../utils/logger';

export interface PayoutProcessResult {
    success: boolean;
    claimId: string;
    reason?: string;
}

/**
 * Process a payout for a single claim. Used by both the auto-payout cron and admin manual payout.
 *
 * Double-pay prevention:
 *   1. Atomically sets payout_status from PENDING → PROCESSING (if 0 rows updated, skip)
 *   2. Calls Wise API to send money
 *   3. On success: PROCESSED. On failure: FAILED.
 */
export async function processPayoutForClaim(
    claimId: string,
    method: 'AUTO' | 'MANUAL',
    adminId?: string,
    ipAddress?: string,
): Promise<PayoutProcessResult> {
    // Step 1: Atomically claim the row
    const [affectedCount] = await OrderClaim.update(
        { payout_status: PayoutStatus.PROCESSING },
        { where: { id: claimId, payout_status: PayoutStatus.PENDING } },
    );

    if (affectedCount === 0) {
        return { success: false, claimId, reason: 'Already processing or not in PENDING status' };
    }

    // Step 2: Load claim with associations
    // Wrap everything in try/catch so PROCESSING never gets stuck
    try {
    const claim = await OrderClaim.findByPk(claimId, {
        include: [
            { model: Campaign, attributes: ['product_title', 'region'] },
            { model: BuyerProfile, attributes: ['id', 'user_id', 'wise_recipient_id', 'total_earnings'] },
        ],
    });

    if (!claim) {
        // Reset since we can't proceed — shouldn't happen but be safe
        await OrderClaim.update({ payout_status: PayoutStatus.FAILED }, { where: { id: claimId } });
        return { success: false, claimId, reason: 'Claim not found' };
    }

    type ClaimWithAssociations = OrderClaim & {
        Campaign?: { product_title: string; region: string };
        BuyerProfile?: { id: string; user_id: string; wise_recipient_id: string | null; total_earnings: number };
    };
    const claimData = claim as ClaimWithAssociations;
    const buyerProfile = claimData.BuyerProfile;
    const campaign = claimData.Campaign;

    // Step 3: Verify buyer has bank account connected
    if (!buyerProfile?.wise_recipient_id) {
        // Set back to PENDING so cron can retry later when buyer connects bank
        await claim.update({ payout_status: PayoutStatus.PENDING });
        return { success: false, claimId, reason: 'Buyer has no bank account connected' };
    }

    // Step 4: Call Wise to send payout
    const sourceCurrency = regionToCurrency(campaign?.region || 'US');
    const amount = parseFloat(String(claim.expected_payout_amount));

    const result = await sendPayout(
        buyerProfile.wise_recipient_id,
        sourceCurrency,
        amount,
        claimId,
    );

    // Step 5: Update claim based on result
    if (result.success) {
        await claim.update({
            payout_status: PayoutStatus.PROCESSED,
            payout_processed_at: new Date(),
            wise_transfer_id: result.wiseTransferId || undefined,
            payout_method: method,
        });

        // Create transaction record
        await Transaction.create({
            user_id: buyerProfile.user_id,
            gross_amount: amount,
            platform_fee: 0,
            net_amount: amount,
            currency: sourceCurrency,
            type: TransactionType.BUYER_PAYOUT,
            wise_transfer_id: result.wiseTransferId || undefined,
            status: TransactionStatus.SUCCESS,
        });

        // Update buyer's total_earnings in USD (base currency) for consistent aggregation.
        const earnedAmountUSD = await toUSD(amount, sourceCurrency);
        const newEarnings = parseFloat(String(buyerProfile.total_earnings)) + earnedAmountUSD;
        await BuyerProfile.update(
            { total_earnings: newEarnings },
            { where: { id: buyerProfile.id } },
        );

        // Send success notification
        const productTitle = campaign?.product_title || 'your product';
        const displayCurrency = result.targetCurrency || sourceCurrency;
        const displayAmount = result.targetAmount ?? amount;
        const formattedAmount = formatAmountWithCurrency(displayAmount, displayCurrency);
        notificationService.send(buyerProfile.user_id, NotificationCategory.PAYOUT_PROCESSED, {
            message: `Your reimbursement of ${formattedAmount} for "${productTitle}" has been sent to your bank account.`,
            actionLink: '/buyer/account',
        }).catch(err => logger.error('Failed to send payout success notification', { err }));

        // Log admin action if manual
        if (method === 'MANUAL' && adminId) {
            await logAdminAction(
                adminId,
                ADMIN_ACTIONS.PAYOUT_PROCESSED,
                claimId,
                'ORDER_CLAIM',
                JSON.stringify({ method, amount, wise_transfer_id: result.wiseTransferId }),
                ipAddress,
            );
        }

        logger.info(`Payout processed successfully`, { claimId, method, amount, transferId: result.wiseTransferId });
        return { success: true, claimId };
    } else {
        // Payout failed
        await claim.update({
            payout_status: PayoutStatus.FAILED,
            payout_method: method,
        });

        // Create failed transaction record
        await Transaction.create({
            user_id: buyerProfile.user_id,
            gross_amount: amount,
            platform_fee: 0,
            net_amount: amount,
            currency: sourceCurrency,
            type: TransactionType.BUYER_PAYOUT,
            wise_transfer_id: result.wiseTransferId || undefined,
            status: TransactionStatus.FAILED,
        });

        // Send failure notification
        const productTitle = campaign?.product_title || 'your product';
        notificationService.send(buyerProfile.user_id, NotificationCategory.PAYOUT_FAILED, {
            message: `Your payout for "${productTitle}" has failed. Our team will look into this. Please ensure your bank details are correct.`,
            actionLink: '/buyer/account',
        }).catch(err => logger.error('Failed to send payout failure notification', { err }));

        // Log admin action if manual
        if (method === 'MANUAL' && adminId) {
            await logAdminAction(
                adminId,
                ADMIN_ACTIONS.PAYOUT_FAILED,
                claimId,
                'ORDER_CLAIM',
                JSON.stringify({ method, amount, error: result.error }),
                ipAddress,
            );
        }

        logger.error(`Payout failed`, { claimId, method, amount, error: result.error });
        return { success: false, claimId, reason: result.error };
    }

    } catch (unexpectedError) {
        // Safety net: if anything throws unexpectedly, don't leave claim stuck in PROCESSING
        logger.error('Unexpected error in processPayoutForClaim, resetting to FAILED', {
            claimId, error: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown',
        });
        await OrderClaim.update(
            { payout_status: PayoutStatus.FAILED },
            { where: { id: claimId, payout_status: PayoutStatus.PROCESSING } },
        ).catch(() => {}); // last resort, don't throw from catch
        return { success: false, claimId, reason: 'Unexpected error during payout processing' };
    }
}
