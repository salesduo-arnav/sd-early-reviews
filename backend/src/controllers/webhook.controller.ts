import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Op } from 'sequelize';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { BuyerProfile } from '../models/BuyerProfile';
import { SystemConfig } from '../models/SystemConfig';
import { constructWebhookEvent, getInvoicePdfUrl, stripe } from '../services/stripe.service';
import { notificationService } from '../services/notification.service';
import { NotificationCategory } from '../models/Notification';
import { CONFIG_KEYS } from '../utils/constants';
import { getMarketplace } from '../config/marketplaces';
import { logger, formatError } from '../utils/logger';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
        return res.status(400).json({ message: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
        event = constructWebhookEvent(req.body, sig);
    } catch (error) {
        logger.error(`Webhook signature verification failed: ${formatError(error)}`);
        return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const campaignId = session.metadata?.campaign_id;

                if (!campaignId) {
                    logger.warn(`Checkout session ${session.id} has no campaign_id in metadata`);
                    break;
                }

                // Activate the campaign
                const campaign = await Campaign.findByPk(campaignId);
                if (campaign && campaign.status === CampaignStatus.PENDING_PAYMENT) {
                    await campaign.update({
                        status: CampaignStatus.ACTIVE,
                        stripe_payment_intent_id: session.id,
                    });
                    logger.info(`Campaign ${campaignId} activated after payment`);

                    // Notify buyers with matching interests (non-blocking)
                    notifyCampaignInterestMatch(campaign).catch((err) =>
                        logger.error('Failed to send campaign interest notifications', { campaignId, error: err })
                    );
                }

                // Mark the transaction as successful and store invoice/receipt URLs
                const transaction = await Transaction.findOne({
                    where: { stripe_transaction_id: campaignId },
                });

                if (transaction) {
                    let receiptUrl: string | undefined;
                    let invoiceUrl: string | undefined;

                    // Get receipt URL from the charge
                    if (session.payment_intent) {
                        try {
                            const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
                            if (pi.latest_charge) {
                                const charge = await stripe.charges.retrieve(pi.latest_charge as string);
                                receiptUrl = charge.receipt_url ?? undefined;
                            }
                        } catch (e) {
                            logger.warn(`Could not fetch receipt URL: ${e instanceof Error ? e.message : e}`);
                        }
                    }

                    // Get invoice PDF URL (from invoice_creation on checkout)
                    if (session.invoice) {
                        try {
                            invoiceUrl = await getInvoicePdfUrl(session.invoice as string) ?? undefined;
                        } catch (e) {
                            logger.warn(`Could not fetch invoice PDF URL: ${e instanceof Error ? e.message : e}`);
                        }
                    }

                    await transaction.update({
                        status: TransactionStatus.SUCCESS,
                        stripe_transaction_id: session.id,
                        receipt_url: receiptUrl,
                        invoice_url: invoiceUrl,
                    });
                    logger.info(`Transaction ${transaction.id} marked SUCCESS for campaign ${campaignId}`);
                } else {
                    logger.warn(`No transaction found for campaign ${campaignId}`);
                }
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object as Stripe.Checkout.Session;
                const campaignId = session.metadata?.campaign_id;

                if (!campaignId) break;

                // Mark campaign as failed — seller can retry by creating a new campaign
                const campaign = await Campaign.findByPk(campaignId);
                if (campaign && campaign.status === CampaignStatus.PENDING_PAYMENT) {
                    await campaign.destroy(); // soft delete
                    logger.info(`Campaign ${campaignId} soft-deleted after checkout expiry`);
                }

                const transaction = await Transaction.findOne({
                    where: { stripe_transaction_id: campaignId },
                });
                if (transaction) {
                    await transaction.update({ status: TransactionStatus.FAILED });
                    logger.info(`Transaction ${transaction.id} marked FAILED after checkout expiry`);
                }
                break;
            }

            default:
                logger.debug(`Unhandled Stripe event type: ${event.type}`);
        }

        return res.json({ received: true });
    } catch (error) {
        logger.error(`Error processing webhook event ${event.type}: ${formatError(error)}`);
        return res.status(500).json({ message: 'Webhook handler error' });
    }
};

/**
 * Notify buyers whose interests match the newly-activated campaign's category.
 * Only sends if the global admin toggle (new_campaign_notifications_enabled) is 'true'.
 *
 * Interest matching:
 *  - null interested_categories = subscribed to ALL categories (default for new buyers).
 *  - Non-empty array = subscribed only to those specific categories.
 *  - Empty array [] = unsubscribed from all categories (no matches).
 */
async function notifyCampaignInterestMatch(campaign: Campaign): Promise<void> {
    // Check global admin toggle
    const config = await SystemConfig.findByPk(CONFIG_KEYS.NEW_CAMPAIGN_NOTIFICATIONS);
    if (!config || config.value !== 'true') {
        logger.debug('Campaign interest notifications skipped: global toggle is off');
        return;
    }

    const category = campaign.category;
    if (!category) {
        logger.debug(`Campaign interest notifications skipped: no category on campaign ${campaign.id}`);
        return;
    }

    // Find buyers who opted in and whose interests match.
    // Empty interested_categories means "all categories", so we match those too.
    const matchingBuyers = await BuyerProfile.findAll({
        where: {
            new_campaign_notifications_enabled: true,
            is_blacklisted: false,
            [Op.or]: [
                // null = subscribed to all categories (default)
                { interested_categories: { [Op.is]: null } },
                // Buyers subscribed to this specific category
                { interested_categories: { [Op.contains]: [category] } },
            ],
        },
        attributes: ['user_id'],
    });

    logger.info(`Campaign ${campaign.id} (category: ${category}): found ${matchingBuyers.length} matching buyers`);

    if (matchingBuyers.length === 0) return;

    const userIds = matchingBuyers.map((b) => b.user_id);

    const marketplace = getMarketplace(campaign.region || 'US');
    const price = Number(campaign.product_price);
    const reimbursementAmount = (price * campaign.reimbursement_percent / 100).toFixed(marketplace.decimalDigits);
    const formattedPrice = `${marketplace.currencySymbol}${price.toFixed(marketplace.decimalDigits)}`;
    const formattedReimbursement = `${marketplace.currencySymbol}${reimbursementAmount}`;
    const actionLink = `/buyer/marketplace/${campaign.id}`;

    await notificationService.sendToMany(userIds, NotificationCategory.NEW_CAMPAIGN_MATCH, {
        message: `A new campaign for "${campaign.product_title}" in ${category} is now available on the marketplace!`,
        actionLink,
        campaignEmailData: {
            productTitle: campaign.product_title,
            productImageUrl: campaign.product_image_url,
            category,
            price: formattedPrice,
            reimbursementPercent: campaign.reimbursement_percent,
            reimbursementAmount: formattedReimbursement,
            actionLink,
        },
    });

    logger.info(`Sent NEW_CAMPAIGN_MATCH notifications to ${userIds.length} buyers for campaign ${campaign.id}`);
}
