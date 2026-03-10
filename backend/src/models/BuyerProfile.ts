import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface BuyerProfileAttributes {
    id: string;
    user_id: string;
    amazon_profile_url: string;
    region: string;
    stripe_connect_account_id?: string | null;
    bank_account_name?: string | null;
    bank_routing_number?: string | null;
    bank_account_last4?: string | null;
    on_time_submission_rate: number;
    is_blacklisted: boolean;
    total_earnings: number;
    email_notifications_enabled: boolean;
    deleted_at?: Date;
}

type BuyerProfileCreationAttributes = Optional<BuyerProfileAttributes, 'id' | 'on_time_submission_rate' | 'is_blacklisted' | 'total_earnings' | 'email_notifications_enabled' | 'stripe_connect_account_id' | 'bank_account_name' | 'bank_routing_number' | 'bank_account_last4' | 'deleted_at'>;

export class BuyerProfile extends Model<BuyerProfileAttributes, BuyerProfileCreationAttributes> implements BuyerProfileAttributes {
    public id!: string;
    public user_id!: string;
    public amazon_profile_url!: string;
    public region!: string;
    public stripe_connect_account_id!: string | null;
    public bank_account_name!: string | null;
    public bank_routing_number!: string | null;
    public bank_account_last4!: string | null;
    public on_time_submission_rate!: number;
    public is_blacklisted!: boolean;
    public total_earnings!: number;
    public email_notifications_enabled!: boolean;
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
        stripe_connect_account_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bank_account_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bank_routing_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bank_account_last4: {
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
