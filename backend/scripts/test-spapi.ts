/**
 * Test SP-API integration: fetch orders, get a single order, and verify ASIN match.
 *
 * Usage:
 *   npx ts-node scripts/test-spapi.ts list-orders <seller_profile_id> [marketplace]
 *   npx ts-node scripts/test-spapi.ts get-order <seller_profile_id> <order_id> [marketplace]
 *   npx ts-node scripts/test-spapi.ts verify <seller_profile_id> <order_id> <asin> [marketplace]
 *
 * marketplace defaults to "com" (US). Other options: ca, co.uk, de, etc.
 *
 * Examples:
 *   npx ts-node scripts/test-spapi.ts list-orders "abc-123" com
 *   npx ts-node scripts/test-spapi.ts get-order "abc-123" "111-2222222-3333333"
 *   npx ts-node scripts/test-spapi.ts verify "abc-123" "111-2222222-3333333" "B0EXAMPLE"
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../src/config/db';
import SellerProfile from '../src/models/SellerProfile';
import { decryptToken } from '../src/utils/encryption';
import { getAccessToken } from '../src/services/spapi/token.service';
import { getOrder, getOrderItems, getRegionConfig, verifyOrderBelongsToSeller } from '../src/services/spapi/orders.service';

// ---- Helpers ----

async function getSellerTokenAndAccess(sellerProfileId: string) {
    const seller = await SellerProfile.findByPk(sellerProfileId);
    if (!seller) {
        throw new Error(`Seller profile "${sellerProfileId}" not found`);
    }
    if (!seller.amzn_refresh_token_encrypted || !seller.amzn_refresh_token_iv || !seller.amzn_refresh_token_tag) {
        throw new Error('Seller has no stored refresh token. Run seed-refresh-token.ts first.');
    }

    const refreshToken = decryptToken(
        seller.amzn_refresh_token_encrypted,
        seller.amzn_refresh_token_iv,
        seller.amzn_refresh_token_tag,
    );

    console.log('Decrypted refresh token OK. Fetching access token...');
    const accessToken = await getAccessToken(refreshToken, sellerProfileId);
    console.log('Access token obtained.\n');
    return { seller, accessToken };
}

function resolveRegion(marketplace: string) {
    const config = getRegionConfig(marketplace);
    if (!config) {
        throw new Error(`Unknown marketplace "${marketplace}". Use: com, ca, co.uk, de, fr, it, es, jp, etc.`);
    }
    return config;
}

// ---- Commands ----

/**
 * List recent orders using the SP-API getOrders endpoint.
 * Note: This calls the getOrders endpoint which is NOT in the orders.service.ts
 * (which only has getOrder for a single order). We call it directly here.
 */
async function listOrders(sellerProfileId: string, marketplace: string) {
    const { accessToken } = await getSellerTokenAndAccess(sellerProfileId);
    const { spApiRegion, marketplaceId } = resolveRegion(marketplace);

    const isSandbox = process.env.SP_API_SANDBOX_MODE === 'true';
    const endpoints: Record<string, string> = isSandbox
        ? {
            NA: 'https://sandbox.sellingpartnerapi-na.amazon.com',
            EU: 'https://sandbox.sellingpartnerapi-eu.amazon.com',
            FE: 'https://sandbox.sellingpartnerapi-fe.amazon.com',
        }
        : {
            NA: 'https://sellingpartnerapi-na.amazon.com',
            EU: 'https://sellingpartnerapi-eu.amazon.com',
            FE: 'https://sellingpartnerapi-fe.amazon.com',
        };

    const baseUrl = endpoints[spApiRegion] || endpoints.NA;

    // Fetch orders from last 30 days
    const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const url = `${baseUrl}/orders/v0/orders?MarketplaceIds=${marketplaceId}&CreatedAfter=${createdAfter}&MaxResultsPerPage=10`;

    console.log(`Fetching orders from ${isSandbox ? 'SANDBOX' : 'PRODUCTION'} (${spApiRegion})...`);
    console.log(`URL: ${url}\n`);

    const response = await fetch(url, {
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const body = await response.text();
        console.error(`Failed (${response.status}):\n${body}`);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await response.json() as any;
    const orders = data.payload?.Orders || [];

    if (orders.length === 0) {
        console.log('No orders found in the last 30 days.');
        return;
    }

    console.log(`Found ${orders.length} orders:\n`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.forEach((order: any, i: number) => {
        console.log(`  ${i + 1}. Order ID:    ${order.AmazonOrderId}`);
        console.log(`     Status:      ${order.OrderStatus}`);
        console.log(`     Date:        ${order.PurchaseDate}`);
        console.log(`     Total:       ${order.OrderTotal?.Amount || 'N/A'} ${order.OrderTotal?.CurrencyCode || ''}`);
        console.log(`     Marketplace: ${order.MarketplaceId}`);
        console.log('');
    });

    if (data.payload?.NextToken) {
        console.log('(More orders available — only showing first 10)');
    }
}

async function getOrderDetails(sellerProfileId: string, orderId: string, marketplace: string) {
    const { accessToken } = await getSellerTokenAndAccess(sellerProfileId);
    const { spApiRegion, marketplaceId } = resolveRegion(marketplace);

    console.log('Fetching order details...');
    const order = await getOrder(accessToken, orderId, marketplaceId, spApiRegion);

    if (!order) {
        console.log('Order not found (404 or 403).');
        return;
    }

    console.log('\nOrder Details:');
    console.log(JSON.stringify(order, null, 2));

    console.log('\nFetching order items...');
    const items = await getOrderItems(accessToken, orderId, spApiRegion);
    console.log(`\nOrder Items (${items.length}):`);
    items.forEach((item, i) => {
        console.log(`  ${i + 1}. ASIN: ${item.ASIN} | Title: ${item.Title || 'N/A'} | Qty: ${item.QuantityOrdered}`);
    });
}

async function verifyOrder(sellerProfileId: string, orderId: string, asin: string, marketplace: string) {
    const { accessToken } = await getSellerTokenAndAccess(sellerProfileId);
    const { spApiRegion, marketplaceId } = resolveRegion(marketplace);

    console.log(`Verifying order ${orderId} for ASIN ${asin}...\n`);
    const result = await verifyOrderBelongsToSeller(accessToken, orderId, asin, marketplaceId, spApiRegion);

    console.log('Verification Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.verified) {
        console.log('\n** VERIFIED — order exists, is not cancelled, and contains the ASIN.');
    } else {
        console.log(`\n** NOT VERIFIED — Reason: ${result.reason}`);
    }
}

// ---- Main ----

async function main() {
    const [command, sellerProfileId, arg1, arg2, arg3] = process.argv.slice(2);

    if (!command || !sellerProfileId) {
        console.log(`
Usage:
  npx ts-node scripts/test-spapi.ts list-orders <seller_profile_id> [marketplace]
  npx ts-node scripts/test-spapi.ts get-order <seller_profile_id> <order_id> [marketplace]
  npx ts-node scripts/test-spapi.ts verify <seller_profile_id> <order_id> <asin> [marketplace]

marketplace defaults to "com" (US).
        `.trim());
        process.exit(1);
    }

    await sequelize.authenticate();
    console.log('DB connected\n');

    console.log(`Mode: ${process.env.SP_API_MOCK_MODE === 'true' ? 'MOCK' : process.env.SP_API_SANDBOX_MODE === 'true' ? 'SANDBOX' : 'PRODUCTION'}\n`);

    switch (command) {
        case 'list-orders':
            await listOrders(sellerProfileId, arg1 || 'com');
            break;
        case 'get-order':
            if (!arg1) { console.error('Missing order_id'); process.exit(1); }
            await getOrderDetails(sellerProfileId, arg1, arg2 || 'com');
            break;
        case 'verify':
            if (!arg1 || !arg2) { console.error('Missing order_id and/or asin'); process.exit(1); }
            await verifyOrder(sellerProfileId, arg1, arg2, arg3 || 'com');
            break;
        default:
            console.error(`Unknown command: ${command}`);
            process.exit(1);
    }

    await sequelize.close();
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
