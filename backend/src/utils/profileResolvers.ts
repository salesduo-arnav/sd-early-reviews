import { BuyerProfile } from '../models/BuyerProfile';
import { SellerProfile } from '../models/SellerProfile';

export async function resolveBuyerProfileId(userId: string): Promise<string | null> {
    const profile = await BuyerProfile.findOne({ where: { user_id: userId } });
    return profile?.id ?? null;
}

export async function resolveSellerProfile(userId: string): Promise<SellerProfile | null> {
    return SellerProfile.findOne({ where: { user_id: userId } });
}

export async function resolveSellerProfileId(userId: string): Promise<string | null> {
    const profile = await SellerProfile.findOne({ where: { user_id: userId } });
    return profile?.id ?? null;
}
