import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export enum CampaignStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED'
}

interface CampaignAttributes {
    id: string;
    seller_id: string;
    asin: string;
    region: string;
    category: string;
    product_title: string;
    product_image_url: string;
    product_price: number;
    target_reviews: number;
    reimbursement_percent: number;
    guidelines?: string;
    status: CampaignStatus;
    stripe_payment_intent_id?: string;
    created_at?: Date;
    deleted_at?: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'status' | 'created_at' | 'guidelines' | 'stripe_payment_intent_id'> { }

export class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
    public id!: string;
    public seller_id!: string;
    public asin!: string;
    public region!: string;
    public category!: string;
    public product_title!: string;
    public product_image_url!: string;
    public product_price!: number;
    public target_reviews!: number;
    public reimbursement_percent!: number;
    public guidelines!: string;
    public status!: CampaignStatus;
    public stripe_payment_intent_id!: string;
    public created_at!: Date;
    public deleted_at!: Date;
}

Campaign.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        seller_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        asin: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        region: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_image_url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        target_reviews: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reimbursement_percent: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        guidelines: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(CampaignStatus)),
            defaultValue: CampaignStatus.DRAFT,
            allowNull: false
        },
        stripe_payment_intent_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'campaigns',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default Campaign;
