import { logger } from '../../utils/logger';

// SP-API regional endpoints
const SP_API_ENDPOINTS: Record<string, string> = {
    NA: 'https://sellingpartnerapi-na.amazon.com',
    EU: 'https://sellingpartnerapi-eu.amazon.com',
    FE: 'https://sellingpartnerapi-fe.amazon.com',
};

const SP_API_SANDBOX_ENDPOINTS: Record<string, string> = {
    NA: 'https://sandbox.sellingpartnerapi-na.amazon.com',
    EU: 'https://sandbox.sellingpartnerapi-eu.amazon.com',
    FE: 'https://sandbox.sellingpartnerapi-fe.amazon.com',
};

// Map campaign region (domain suffix) to SP-API region and marketplace ID
const REGION_MAP: Record<string, { spApiRegion: string; marketplaceId: string }> = {
    'com':    { spApiRegion: 'NA', marketplaceId: 'ATVPDKIKX0DER' },     // US
    'ca':     { spApiRegion: 'NA', marketplaceId: 'A2EUQ1WTGCTBG2' },    // Canada
    'com.mx': { spApiRegion: 'NA', marketplaceId: 'A1AM78C64UM0Y8' },    // Mexico
    'com.br': { spApiRegion: 'NA', marketplaceId: 'A2Q3Y263D00KWC' },    // Brazil
    'co.uk':  { spApiRegion: 'EU', marketplaceId: 'A1F83G8C2ARO7P' },    // UK
    'de':     { spApiRegion: 'EU', marketplaceId: 'A1PA6795UKMFR9' },    // Germany
    'fr':     { spApiRegion: 'EU', marketplaceId: 'A13V1IB3VIYZZH' },    // France
    'it':     { spApiRegion: 'EU', marketplaceId: 'APJ6JRA9NG5V4' },     // Italy
    'es':     { spApiRegion: 'EU', marketplaceId: 'A1RKKUPIHCS9HS' },    // Spain
    'nl':     { spApiRegion: 'EU', marketplaceId: 'A1805IZSGTT6HS' },    // Netherlands
    'se':     { spApiRegion: 'EU', marketplaceId: 'A2NODRKZP88ZB9' },    // Sweden
    'pl':     { spApiRegion: 'EU', marketplaceId: 'A1C3SOZRARQ6R3' },    // Poland
    'ae':     { spApiRegion: 'EU', marketplaceId: 'A2VIGQ35RCS4UG' },    // UAE
    'sa':     { spApiRegion: 'EU', marketplaceId: 'A17E79C6D8DWNP' },    // Saudi Arabia
    'eg':     { spApiRegion: 'EU', marketplaceId: 'ARBP9OOSHTCHU' },     // Egypt
    'in':     { spApiRegion: 'EU', marketplaceId: 'A21TJRUUN4KGV' },     // India
    'jp':     { spApiRegion: 'FE', marketplaceId: 'A1VC38T7YXB528' },    // Japan
    'com.au': { spApiRegion: 'FE', marketplaceId: 'A39IBJ37TRP1C6' },    // Australia
    'sg':     { spApiRegion: 'FE', marketplaceId: 'A19VAU5U5O7RUS' },    // Singapore
};

export interface SPAPIOrderResponse {
    AmazonOrderId: string;
    OrderStatus: string;
    PurchaseDate: string;
    LastUpdateDate: string;
    OrderTotal?: { Amount: string; CurrencyCode: string };
    MarketplaceId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface SPAPIOrderItem {
    ASIN: string;
    OrderItemId: string;
    QuantityOrdered: number;
    Title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface OrderVerificationResult {
    verified: boolean;
    amazonOrderId?: string;
    orderStatus?: string;
    purchaseDate?: string;
    asinMatched?: boolean;
    reason?: string;
    rawResponse?: Record<string, unknown>;
}

function getBaseUrl(spApiRegion: string): string {
    const isSandbox = process.env.SP_API_SANDBOX_MODE === 'true';
    const endpoints = isSandbox ? SP_API_SANDBOX_ENDPOINTS : SP_API_ENDPOINTS;
    return endpoints[spApiRegion] || endpoints.NA;
}

export function getRegionConfig(campaignRegion: string): { spApiRegion: string; marketplaceId: string } | null {
    return REGION_MAP[campaignRegion] || null;
}

/**
 * Fetch order details by Amazon Order ID.
 */
export async function getOrder(
    accessToken: string,
    orderId: string,
    marketplaceId: string,
    spApiRegion: string
): Promise<SPAPIOrderResponse | null> {
    const baseUrl = getBaseUrl(spApiRegion);
    const url = `${baseUrl}/orders/v0/orders/${encodeURIComponent(orderId)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'x-amz-access-token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 404) {
            return null;
        }

        if (response.status === 403) {
            logger.warn('SP-API order lookup forbidden - check seller authorization', { orderId });
            return null;
        }

        if (response.status === 429) {
            logger.warn('SP-API rate limited on getOrder', { orderId });
            throw new Error('SP-API rate limited');
        }

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('SP-API getOrder failed', { status: response.status, body: errorBody });
            throw new Error(`SP-API getOrder failed: ${response.status}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await response.json() as any;
        return data.payload as SPAPIOrderResponse;
    } catch (error) {
        if (error instanceof Error && error.message.includes('rate limited')) throw error;
        logger.error('SP-API getOrder error', { orderId, error });
        throw error;
    }
}

/**
 * Fetch order items to verify ASIN match.
 */
export async function getOrderItems(
    accessToken: string,
    orderId: string,
    spApiRegion: string
): Promise<SPAPIOrderItem[]> {
    const baseUrl = getBaseUrl(spApiRegion);
    const url = `${baseUrl}/orders/v0/orders/${encodeURIComponent(orderId)}/orderItems`;

    try {
        const response = await fetch(url, {
            headers: {
                'x-amz-access-token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('SP-API getOrderItems failed', { status: response.status, body: errorBody });
            throw new Error(`SP-API getOrderItems failed: ${response.status}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await response.json() as any;
        return (data.payload?.OrderItems || []) as SPAPIOrderItem[];
    } catch (error) {
        logger.error('SP-API getOrderItems error', { orderId, error });
        throw error;
    }
}

/**
 * Full order verification: check order exists, is not cancelled, and contains the expected ASIN.
 */
export async function verifyOrderBelongsToSeller(
    accessToken: string,
    orderId: string,
    expectedAsin: string,
    marketplaceId: string,
    spApiRegion: string
): Promise<OrderVerificationResult> {
    // Step 1: Get the order
    const order = await getOrder(accessToken, orderId, marketplaceId, spApiRegion);

    if (!order) {
        return { verified: false, reason: 'Order not found in seller account' };
    }

    // Step 2: Check order is not cancelled
    if (order.OrderStatus === 'Canceled' || order.OrderStatus === 'Cancelled') {
        return {
            verified: false,
            amazonOrderId: order.AmazonOrderId,
            orderStatus: order.OrderStatus,
            purchaseDate: order.PurchaseDate,
            reason: 'Order is cancelled',
            rawResponse: order as unknown as Record<string, unknown>,
        };
    }

    // Step 3: Get order items and verify ASIN
    const items = await getOrderItems(accessToken, orderId, spApiRegion);
    const asinMatched = items.some(item => item.ASIN === expectedAsin);

    if (!asinMatched) {
        return {
            verified: false,
            amazonOrderId: order.AmazonOrderId,
            orderStatus: order.OrderStatus,
            purchaseDate: order.PurchaseDate,
            asinMatched: false,
            reason: `Order does not contain expected ASIN ${expectedAsin}`,
            rawResponse: order as unknown as Record<string, unknown>,
        };
    }

    // All checks passed
    return {
        verified: true,
        amazonOrderId: order.AmazonOrderId,
        orderStatus: order.OrderStatus,
        purchaseDate: order.PurchaseDate,
        asinMatched: true,
        rawResponse: order as unknown as Record<string, unknown>,
    };
}
