import { Request, Response } from 'express';
import { OrderClaim, PayoutStatus } from '../models/OrderClaim';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { BuyerProfile } from '../models/BuyerProfile';
import { notificationService } from '../services/notification.service';
import { NotificationCategory } from '../models/Notification';
import { Campaign } from '../models/Campaign';
import { logger } from '../utils/logger';

/**
 * Wise webhook handler for transfer state changes.
 *
 * Wise sends these events:
 *   - transfers#state-change → status can be:
 *       outgoing_payment_sent  — money sent to recipient bank
 *       funds_refunded         — transfer bounced back
 *       cancelled              — transfer was cancelled
 *
 * We use this to catch payouts that were initially accepted but later failed.
 */
export const handleWiseWebhook = async (req: Request, res: Response) => {
    try {
        const { event_type, data } = req.body;

        if (event_type !== 'transfers#state-change') {
            // We only care about transfer state changes
            return res.status(200).json({ message: 'Ignored' });
        }

        const transferId = String(data?.resource?.id);
        const currentState = data?.current_state;

        if (!transferId || !currentState) {
            return res.status(200).json({ message: 'Missing data' });
        }

        logger.info('Wise webhook: transfer state change', { transferId, currentState });

        // Find the claim by wise_transfer_id
        const claim = await OrderClaim.findOne({
            where: { wise_transfer_id: transferId },
            include: [
                { model: Campaign, attributes: ['product_title'] },
                { model: BuyerProfile, attributes: ['id', 'user_id', 'total_earnings'] },
            ],
        });

        if (!claim) {
            // Transfer not tracked by us (or old transfer) — ignore
            return res.status(200).json({ message: 'Transfer not found' });
        }

        type ClaimWithAssoc = OrderClaim & {
            Campaign?: { product_title: string };
            BuyerProfile?: { id: string; user_id: string; total_earnings: number };
        };
        const claimData = claim as ClaimWithAssoc;

        if (currentState === 'funds_refunded' || currentState === 'cancelled') {
            // Transfer failed after initial acceptance — reverse the payout
            if (claim.payout_status === PayoutStatus.PROCESSED) {
                const amount = parseFloat(String(claim.expected_payout_amount));

                await claim.update({ payout_status: PayoutStatus.FAILED });

                // Reverse the earnings
                if (claimData.BuyerProfile) {
                    const currentEarnings = parseFloat(String(claimData.BuyerProfile.total_earnings));
                    const corrected = Math.max(0, currentEarnings - amount);
                    await BuyerProfile.update(
                        { total_earnings: corrected },
                        { where: { id: claimData.BuyerProfile.id } },
                    );
                }

                // Update transaction status
                await Transaction.update(
                    { status: TransactionStatus.FAILED },
                    { where: { wise_transfer_id: transferId } },
                );

                // Notify buyer
                const productTitle = claimData.Campaign?.product_title || 'your product';
                if (claimData.BuyerProfile?.user_id) {
                    notificationService.send(claimData.BuyerProfile.user_id, NotificationCategory.PAYOUT_FAILED, {
                        message: `Your payout for "${productTitle}" was returned by your bank. Please verify your bank details and contact support.`,
                        actionLink: '/buyer/account',
                    }).catch(err => logger.error('Failed to send refund notification', { err }));
                }

                logger.warn('Wise webhook: payout reversed due to refund/cancellation', { transferId, claimId: claim.id });
            }
        }

        // outgoing_payment_sent — confirms delivery, no action needed (already PROCESSED)

        return res.status(200).json({ message: 'OK' });
    } catch (error) {
        logger.error(`Wise webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
