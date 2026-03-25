import { logger } from '../../utils/logger';
import { getSpApiConfig } from '../../config/marketplaces';

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
    return getSpApiConfig(campaignRegion);
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
