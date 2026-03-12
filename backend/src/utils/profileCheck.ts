import { UserRole } from '../models/User';
import BuyerProfile from '../models/BuyerProfile';
import SellerProfile from '../models/SellerProfile';

export async function hasUserProfile(userId: string, role: string): Promise<boolean> {
    if (role === UserRole.ADMIN) return true;
    if (role === UserRole.BUYER) {
        return (await BuyerProfile.count({ where: { user_id: userId } })) > 0;
    }
    return (await SellerProfile.count({ where: { user_id: userId } })) > 0;
}
