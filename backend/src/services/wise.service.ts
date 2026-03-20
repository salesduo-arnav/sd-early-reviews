import { logger } from '../utils/logger';

// ─── Configuration ──────────────────────────────────────────────────────────

const WISE_API_TOKEN = process.env.WISE_API_TOKEN as string;
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID as string;
const WISE_MODE = process.env.WISE_MODE || 'sandbox';

const BASE_URL = WISE_MODE === 'live'
    ? 'https://api.wise.com'
    : 'https://api.wise-sandbox.com';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function wiseRequest<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
            'Authorization': `Bearer ${WISE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    const data = await res.json();

    if (!res.ok) {
        logger.error('Wise API error', { status: res.status, url, data });
        const message = Array.isArray(data?.errors)
            ? data.errors.map((e: { message: string }) => e.message).join(', ')
            : data?.message || `Wise API error ${res.status}`;
        throw new Error(message);
    }

    return data as T;
}

// ─── Region → Currency mapping ──────────────────────────────────────────────

const REGION_CURRENCY_MAP: Record<string, string> = {
    'com': 'USD',
    'co.uk': 'GBP',
    'de': 'EUR',
    'fr': 'EUR',
    'it': 'EUR',
    'es': 'EUR',
    'nl': 'EUR',
    'co.jp': 'JPY',
    'in': 'INR',
    'com.au': 'AUD',
    'ca': 'CAD',
    'com.br': 'BRL',
    'com.mx': 'MXN',
    'sg': 'SGD',
    'ae': 'AED',
    'sa': 'SAR',
    'pl': 'PLN',
    'se': 'SEK',
};

export function regionToCurrency(region: string): string {
    return REGION_CURRENCY_MAP[region] || 'USD';
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WiseAccountRequirementField {
    name: string;
    group: Array<{
        key: string;
        type: string;
        refreshRequirementsOnChange: boolean;
        required: boolean;
        displayFormat: string | null;
        example: string;
        minLength: number | null;
        maxLength: number | null;
        validationRegexp: string | null;
        valuesAllowed: Array<{ key: string; name: string }> | null;
    }>;
}

export interface WiseAccountRequirement {
    type: string;
    title: string;
    fields: WiseAccountRequirementField[];
}

interface WiseQuote {
    id: string;
    sourceCurrency: string;
    targetCurrency: string;
    sourceAmount: number;
    targetAmount: number;
    rate: number;
    fee: number;
}

interface WiseRecipient {
    id: number;
    accountHolderName: string;
    currency: string;
    country: string;
    type: string;
}

interface WiseTransfer {
    id: number;
    status: string;
    sourceCurrency: string;
    targetCurrency: string;
    sourceValue: number;
    targetValue: number;
    reference: string;
}

interface WiseFundResponse {
    type: string;
    status: string;
    errorCode: string | null;
}

// ─── Account Requirements (dynamic bank fields) ────────────────────────────

export async function getAccountRequirements(
    targetCurrency: string,
    sourceAmount: number = 100,
): Promise<WiseAccountRequirement[]> {
    return wiseRequest<WiseAccountRequirement[]>(
        `/v1/account-requirements?source=USD&target=${targetCurrency}&sourceAmount=${sourceAmount}`,
    );
}

/**
 * Refresh account requirements with current form values (POST).
 * Used when a field with refreshRequirementsOnChange=true is changed.
 */
export async function refreshAccountRequirements(
    targetCurrency: string,
    formValues: Record<string, unknown>,
    sourceAmount: number = 100,
): Promise<WiseAccountRequirement[]> {
    return wiseRequest<WiseAccountRequirement[]>(
        `/v1/account-requirements?source=USD&target=${targetCurrency}&sourceAmount=${sourceAmount}`,
        { method: 'POST', body: formValues },
    );
}

// ─── Recipient Management ───────────────────────────────────────────────────

export async function createRecipient(data: {
    accountHolderName: string;
    currency: string;
    type: string;
    details: Record<string, unknown>;
    ownedByCustomer: boolean;
}): Promise<WiseRecipient> {
    return wiseRequest<WiseRecipient>('/v1/accounts', {
        method: 'POST',
        body: {
            profile: WISE_PROFILE_ID,
            ...data,
        },
    });
}

export async function deleteRecipient(recipientId: string): Promise<void> {
    const url = `${BASE_URL}/v1/accounts/${recipientId}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${WISE_API_TOKEN}` },
    });
    if (!res.ok && res.status !== 404) {
        logger.error('Wise delete recipient error', { status: res.status, recipientId });
        throw new Error(`Failed to delete Wise recipient: ${res.status}`);
    }
}

export async function getRecipient(recipientId: string): Promise<WiseRecipient> {
    return wiseRequest<WiseRecipient>(`/v1/accounts/${recipientId}`);
}

// ─── Quote ──────────────────────────────────────────────────────────────────

export async function createQuote(
    sourceCurrency: string,
    targetCurrency: string,
    sourceAmount: number,
): Promise<WiseQuote> {
    return wiseRequest<WiseQuote>(`/v3/profiles/${WISE_PROFILE_ID}/quotes`, {
        method: 'POST',
        body: {
            sourceCurrency,
            targetCurrency,
            sourceAmount,
            targetAmount: null,
            payOut: 'BANK_TRANSFER',
        },
    });
}

// ─── Transfer ───────────────────────────────────────────────────────────────

export async function createTransfer(
    quoteId: string,
    recipientId: string,
    reference: string,
): Promise<WiseTransfer> {
    return wiseRequest<WiseTransfer>('/v1/transfers', {
        method: 'POST',
        body: {
            targetAccount: Number(recipientId),
            quoteUuid: quoteId,
            customerTransactionId: reference,
            details: {
                reference: reference.substring(0, 10),
                transferPurpose: 'verification.transfers.purpose.pay.bills',
                sourceOfFunds: 'verification.source.of.funds.other',
            },
        },
    });
}

export async function fundTransfer(transferId: number): Promise<WiseFundResponse> {
    return wiseRequest<WiseFundResponse>(
        `/v3/profiles/${WISE_PROFILE_ID}/transfers/${transferId}/payments`,
        {
            method: 'POST',
            body: { type: 'BALANCE' },
        },
    );
}

export async function getTransferStatus(transferId: number): Promise<WiseTransfer> {
    return wiseRequest<WiseTransfer>(`/v1/transfers/${transferId}`);
}

// ─── High-level payout function ─────────────────────────────────────────────

export interface PayoutResult {
    success: boolean;
    transferId?: number;
    wiseTransferId?: string;
    error?: string;
}

export async function sendPayout(
    recipientId: string,
    sourceCurrency: string,
    amount: number,
    claimId: string,
): Promise<PayoutResult> {
    try {
        // Get recipient to determine target currency
        const recipient = await getRecipient(recipientId);
        const targetCurrency = recipient.currency;

        // 1. Create quote
        const quote = await createQuote(sourceCurrency, targetCurrency, amount);
        logger.info(`Wise quote created`, { quoteId: quote.id, rate: quote.rate, fee: quote.fee, claimId });

        // 2. Create transfer (use unique UUID per attempt to avoid idempotency conflicts on retry)
        const crypto = require('crypto');
        const txnId = crypto.randomUUID();
        const transfer = await createTransfer(quote.id, recipientId, txnId);
        logger.info(`Wise transfer created`, { transferId: transfer.id, claimId });

        // 3. Fund transfer from balance
        const funding = await fundTransfer(transfer.id);
        if (funding.status === 'REJECTED' || funding.errorCode) {
            throw new Error(`Wise funding rejected: ${funding.errorCode || 'unknown'}`);
        }
        logger.info(`Wise transfer funded`, { transferId: transfer.id, status: funding.status, claimId });

        return {
            success: true,
            transferId: transfer.id,
            wiseTransferId: String(transfer.id),
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Wise payout error';
        logger.error('Wise payout failed', { claimId, recipientId, amount, error: message });
        return { success: false, error: message };
    }
}

// ─── Webhook signature verification ─────────────────────────────────────────

export function verifyWebhookSecret(req: { headers: Record<string, string | string[] | undefined> }): boolean {
    const expected = process.env.WISE_WEBHOOK_SECRET;
    if (!expected) {
        logger.warn('WISE_WEBHOOK_SECRET not set, skipping webhook verification');
        return true;
    }
    const received = req.headers['x-custom-secret'];
    return received === expected;
}
