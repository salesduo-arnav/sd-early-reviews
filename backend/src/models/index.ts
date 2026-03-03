import sequelize from '../config/db';

export default sequelize;

// Import models
import User from './User';
import BuyerProfile from './BuyerProfile';
import SellerProfile from './SellerProfile';
import Campaign from './Campaign';
import OrderClaim from './OrderClaim';
import Transaction from './Transaction';
import Notification from './Notification';
import AdminAuditLog from './AdminAuditLog';

// Define relationships
User.hasOne(BuyerProfile, { foreignKey: 'user_id' });
BuyerProfile.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(SellerProfile, { foreignKey: 'user_id' });
SellerProfile.belongsTo(User, { foreignKey: 'user_id' });

SellerProfile.hasMany(Campaign, { foreignKey: 'seller_id' });
Campaign.belongsTo(SellerProfile, { foreignKey: 'seller_id' });

Campaign.hasMany(OrderClaim, { foreignKey: 'campaign_id' });
OrderClaim.belongsTo(Campaign, { foreignKey: 'campaign_id' });

BuyerProfile.hasMany(OrderClaim, { foreignKey: 'buyer_id' });
OrderClaim.belongsTo(BuyerProfile, { foreignKey: 'buyer_id' });

User.hasMany(OrderClaim, { foreignKey: 'verified_by_admin_id', as: 'VerifiedClaims' });
OrderClaim.belongsTo(User, { foreignKey: 'verified_by_admin_id', as: 'AdminVerifier' });

User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AdminAuditLog, { foreignKey: 'admin_id' });
AdminAuditLog.belongsTo(User, { foreignKey: 'admin_id' });

export {
    User,
    BuyerProfile,
    SellerProfile,
    Campaign,
    OrderClaim,
    Transaction,
    Notification,
    AdminAuditLog
};
