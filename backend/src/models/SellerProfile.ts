import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface SellerProfileAttributes {
    id: string;
    user_id: string;
    company_name?: string;
    stripe_customer_id: string;
    deleted_at?: Date;
}

type SellerProfileCreationAttributes = Optional<SellerProfileAttributes, 'id' | 'company_name'>;

export class SellerProfile extends Model<SellerProfileAttributes, SellerProfileCreationAttributes> implements SellerProfileAttributes {
    public id!: string;
    public user_id!: string;
    public company_name!: string;
    public stripe_customer_id!: string;
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
