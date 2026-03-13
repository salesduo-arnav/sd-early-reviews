import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface SellerProfileAttributes {
    id: string;
    user_id: string;
    company_name?: string;
    stripe_customer_id: string;
    amzn_selling_partner_id?: string;
    amzn_refresh_token_encrypted?: string;
    amzn_refresh_token_iv?: string;
    amzn_refresh_token_tag?: string;
    amzn_authorized_at?: Date;
    amzn_authorization_status?: string;
    deleted_at?: Date;
}

type SellerProfileCreationAttributes = Optional<SellerProfileAttributes, 'id' | 'company_name' | 'amzn_selling_partner_id' | 'amzn_refresh_token_encrypted' | 'amzn_refresh_token_iv' | 'amzn_refresh_token_tag' | 'amzn_authorized_at' | 'amzn_authorization_status'>;

export class SellerProfile extends Model<SellerProfileAttributes, SellerProfileCreationAttributes> implements SellerProfileAttributes {
    public id!: string;
    public user_id!: string;
    public company_name!: string;
    public stripe_customer_id!: string;
    public amzn_selling_partner_id!: string;
    public amzn_refresh_token_encrypted!: string;
    public amzn_refresh_token_iv!: string;
    public amzn_refresh_token_tag!: string;
    public amzn_authorized_at!: Date;
    public amzn_authorization_status!: string;
    public deleted_at!: Date;
}

SellerProfile.init(
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
        company_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        stripe_customer_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amzn_selling_partner_id: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        amzn_refresh_token_encrypted: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        amzn_refresh_token_iv: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        amzn_refresh_token_tag: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        amzn_authorized_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        amzn_authorization_status: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'seller_profiles',
        timestamps: true,
        createdAt: false,
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default SellerProfile;
