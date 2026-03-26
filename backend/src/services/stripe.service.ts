import Stripe from 'stripe';
import { SellerProfile } from '../models/SellerProfile';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Lazily creates a Stripe customer for a seller, or returns the existing one.
 */
export async function getOrCreateStripeCustomer(
    sellerProfile: SellerProfile,
    email: string
): Promise<string> {
    if (sellerProfile.stripe_customer_id) {
        return sellerProfile.stripe_customer_id;
    }

    const customer = await stripe.customers.create({
        email,
        metadata: {
            seller_profile_id: sellerProfile.id,
            user_id: sellerProfile.user_id,
        },
    });

    await sellerProfile.update({ stripe_customer_id: customer.id });
    logger.info(`Created Stripe customer ${customer.id} for seller ${sellerProfile.id}`);

    return customer.id;
}

/**
 * Creates a Stripe Checkout Session for a one-time campaign payment.
 * The seller is redirected to Stripe's hosted page to pay.
 */
export async function createCheckoutSession(opts: {
    customerId: string;
    campaignId: string;
    productTitle: string;
    asin: string;
    region: string;
    /** ISO 4217 currency code (usd, inr, eur, …) — lowercase for Stripe */
    currency: string;
    targetReviews: number;
    reimbursementCents: number;
    platformFeeCents: number;
    successUrl: string;
    cancelUrl: string;
}): Promise<string> {
    const cur = opts.currency.toLowerCase();
    const session = await stripe.checkout.sessions.create({
        customer: opts.customerId,
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: cur,
                    unit_amount: Math.round(opts.reimbursementCents / opts.targetReviews),
                    product_data: {
                        name: `Buyer Reimbursement — ${opts.productTitle}`,
                        description: `ASIN: ${opts.asin} | Region: ${opts.region}`,
                    },
                },
                quantity: opts.targetReviews,
            },
            {
                price_data: {
                    currency: cur,
                    unit_amount: opts.platformFeeCents,
                    product_data: {
                        name: 'Platform Service Fee',
                    },
                },
                quantity: 1,
            },
        ],
        invoice_creation: { enabled: true },
        metadata: { campaign_id: opts.campaignId },
        success_url: opts.successUrl,
        cancel_url: opts.cancelUrl,
    });

    return session.url as string;
}

/**
 * Retrieves a Checkout Session by ID (used in webhook to read metadata).
 */
export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Gets the hosted invoice PDF URL for a checkout session's invoice.
 * Returns null if no invoice exists yet.
 */
export async function getInvoicePdfUrl(invoiceId: string): Promise<string | null> {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice.invoice_pdf ?? null;
}

/**
 * Verifies and constructs a Stripe webhook event from the raw request body.
 */
export function constructWebhookEvent(payload: Buffer, sig: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
    );
}

export { stripe };
