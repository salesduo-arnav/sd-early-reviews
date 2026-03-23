import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { constructWebhookEvent, getInvoicePdfUrl, stripe } from '../services/stripe.service';
import { logger } from '../utils/logger';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
        return res.status(400).json({ message: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
        event = constructWebhookEvent(req.body, sig);
    } catch (error) {
        logger.error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        logger.error(`Error processing webhook event ${event.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Webhook handler error' });
    }
};
