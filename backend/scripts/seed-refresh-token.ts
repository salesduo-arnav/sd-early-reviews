/**
 * Seed a seller's refresh token into the database, bypassing the OAuth flow.
 *
 * Usage:
 *   npx ts-node scripts/seed-refresh-token.ts <seller_profile_id> <refresh_token> [selling_partner_id]
 *
 * Example:
 *   npx ts-node scripts/seed-refresh-token.ts "abc-123-uuid" "Atzr|IwEB..." "A3EXAMPLE"
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { encryptToken } from '../src/utils/encryption';
import sequelize from '../src/config/db';
import SellerProfile from '../src/models/SellerProfile';

async function main() {
    const [sellerProfileId, refreshToken, sellingPartnerId] = process.argv.slice(2);

    if (!sellerProfileId || !refreshToken) {
        console.error('Usage: npx ts-node scripts/seed-refresh-token.ts <seller_profile_id> <refresh_token> [selling_partner_id]');
        process.exit(1);
    }

    await sequelize.authenticate();
    console.log('DB connected');

    const seller = await SellerProfile.findByPk(sellerProfileId);
    if (!seller) {
        console.error(`Seller profile "${sellerProfileId}" not found.`);

        // List available sellers to help the user
        const sellers = await SellerProfile.findAll({ attributes: ['id', 'company_name', 'user_id', 'amzn_authorization_status'] });
        console.log('\nAvailable seller profiles:');
        sellers.forEach(s => {
            console.log(`  ID: ${s.id} | Company: ${s.company_name || '(none)'} | Auth: ${s.amzn_authorization_status || 'NOT_SET'}`);
        });
        process.exit(1);
    }

    // Encrypt the refresh token
    const { encrypted, iv, tag } = encryptToken(refreshToken);

    // Update seller profile
    await seller.update({
        amzn_refresh_token_encrypted: encrypted,
        amzn_refresh_token_iv: iv,
        amzn_refresh_token_tag: tag,
        amzn_authorized_at: new Date(),
        amzn_authorization_status: 'AUTHORIZED',
        ...(sellingPartnerId ? { amzn_selling_partner_id: sellingPartnerId } : {}),
    });

    console.log(`\nRefresh token seeded for seller "${seller.company_name || seller.id}"`);
    console.log(`  Authorization status: AUTHORIZED`);
    console.log(`  Selling partner ID: ${sellingPartnerId || seller.amzn_selling_partner_id || '(unchanged)'}`);

    await sequelize.close();
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
