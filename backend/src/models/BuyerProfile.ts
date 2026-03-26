import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface BuyerProfileAttributes {
    id: string;
    user_id: string;
    amazon_profile_url: string;
    region: string;
    wise_recipient_id?: string | null;
    payout_currency?: string | null;
    payout_country?: string | null;
    bank_display_label?: string | null;
    on_time_submission_rate: number;
    is_blacklisted: boolean;
    blacklist_reason?: string | null;
    blacklisted_at?: Date | null;
    blacklisted_by?: string | null;
    total_earnings: number;
    email_notifications_enabled: boolean;
    new_campaign_notifications_enabled: boolean;
    interested_categories: string[] | null;
    deleted_at?: Date;
}

type BuyerProfileCreationAttributes = Optional<BuyerProfileAttributes, 'id' | 'on_time_submission_rate' | 'is_blacklisted' | 'blacklist_reason' | 'blacklisted_at' | 'blacklisted_by' | 'total_earnings' | 'email_notifications_enabled' | 'new_campaign_notifications_enabled' | 'interested_categories' | 'wise_recipient_id' | 'payout_currency' | 'payout_country' | 'bank_display_label' | 'deleted_at'>;

export class BuyerProfile extends Model<BuyerProfileAttributes, BuyerProfileCreationAttributes> implements BuyerProfileAttributes {
    public id!: string;
    public user_id!: string;
    public amazon_profile_url!: string;
    public region!: string;
    public wise_recipient_id!: string | null;
    public payout_currency!: string | null;
    public payout_country!: string | null;
    public bank_display_label!: string | null;
    public on_time_submission_rate!: number;
    public is_blacklisted!: boolean;
    public blacklist_reason!: string | null;
    public blacklisted_at!: Date | null;
    public blacklisted_by!: string | null;
    public total_earnings!: number;
    public email_notifications_enabled!: boolean;
    public new_campaign_notifications_enabled!: boolean;
    public interested_categories!: string[] | null;
    public deleted_at!: Date;
}

BuyerProfile.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        amazon_profile_url: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        region: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        wise_recipient_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        payout_currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
        },
        payout_country: {
            type: DataTypes.STRING(2),
            allowNull: true,
        },
        bank_display_label: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        on_time_submission_rate: {
            type: DataTypes.FLOAT,
            defaultValue: 100.0,
            allowNull: false
        },
        is_blacklisted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        blacklist_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        blacklisted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        blacklisted_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        total_earnings: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0,
            allowNull: false
        },
        email_notifications_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        new_campaign_notifications_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        interested_categories: {
            type: DataTypes.JSONB,
            defaultValue: null,
            allowNull: true,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'buyer_profiles',
        timestamps: true,
        createdAt: false,
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default BuyerProfile;
