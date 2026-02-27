import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface BuyerProfileAttributes {
    id: string;
    user_id: string;
    amazon_profile_url: string;
    stripe_connect_account_id?: string;
    bank_account_name?: string;
    bank_routing_number?: string;
    bank_account_last4?: string;
    on_time_submission_rate: number;
    is_blacklisted: boolean;
    total_earnings: number;
    deleted_at?: Date;
}

type BuyerProfileCreationAttributes = Optional<BuyerProfileAttributes, 'id' | 'on_time_submission_rate' | 'is_blacklisted' | 'total_earnings' | 'stripe_connect_account_id' | 'bank_account_name' | 'bank_routing_number' | 'bank_account_last4' | 'deleted_at'>;

export class BuyerProfile extends Model<BuyerProfileAttributes, BuyerProfileCreationAttributes> implements BuyerProfileAttributes {
    public id!: string;
    public user_id!: string;
    public amazon_profile_url!: string;
    public stripe_connect_account_id!: string;
    public bank_account_name!: string;
    public bank_routing_number!: string;
    public bank_account_last4!: string;
    public on_time_submission_rate!: number;
    public is_blacklisted!: boolean;
    public total_earnings!: number;
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
