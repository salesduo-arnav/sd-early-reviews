import { OrderVerificationResult } from './orders.service';

// Test order IDs for mock mode
// Auto-approve: 111-1111111-1111111 through 111-1111111-1111110
// Cancelled:    333-3333333-3333333 through 333-3333333-3333332
// Any other order ID: returns "not found"
const MOCK_VERIFIED_ORDERS = new Set([
    '111-1111111-1111111',
    '111-1111111-1111112',
    '111-1111111-1111113',
    '111-1111111-1111114',
    '111-1111111-1111115',
    '111-1111111-1111116',
    '111-1111111-1111117',
    '111-1111111-1111118',
    '111-1111111-1111119',
    '111-1111111-1111110',
]);

const MOCK_CANCELLED_ORDERS = new Set([
    '333-3333333-3333333',
    '333-3333333-3333334',
    '333-3333333-3333335',
    '333-3333333-3333336',
    '333-3333333-3333337',
    '333-3333333-3333338',
    '333-3333333-3333339',
    '333-3333333-3333330',
    '333-3333333-3333331',
    '333-3333333-3333332',
]);

/**
 * Mock order verification for local development and CI.
 * - Order IDs 111-1111111-111111[0-9]: always verify successfully
 * - Order IDs 333-3333333-333333[0-9]: return cancelled
 * - Any other order ID: returns not found
 */
export function mockVerifyOrder(orderId: string, expectedAsin: string): OrderVerificationResult {
    if (MOCK_VERIFIED_ORDERS.has(orderId)) {
        return {
            verified: true,
            amazonOrderId: orderId,
            orderStatus: 'Shipped',
            purchaseDate: new Date().toISOString(),
            asinMatched: true,
            rawResponse: {
                _mock: true,
                AmazonOrderId: orderId,
                OrderStatus: 'Shipped',
                PurchaseDate: new Date().toISOString(),
                OrderItems: [{ ASIN: expectedAsin, QuantityOrdered: 1 }],
            },
        };
    }

    if (MOCK_CANCELLED_ORDERS.has(orderId)) {
        return {
            verified: false,
            amazonOrderId: orderId,
            orderStatus: 'Cancelled',
            purchaseDate: new Date().toISOString(),
            reason: 'Order is cancelled',
            rawResponse: { _mock: true },
        };
    }

    // Default: order not found
    return {
        verified: false,
        reason: 'Order not found in seller account',
        rawResponse: { _mock: true },
    };
}
