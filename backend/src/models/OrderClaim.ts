import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export enum OrderStatus {
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum ReviewStatus {
    AWAITING_UPLOAD = 'AWAITING_UPLOAD',
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    TIMEOUT = 'TIMEOUT'
}

export enum PayoutStatus {
    NOT_ELIGIBLE = 'NOT_ELIGIBLE',
    PENDING = 'PENDING',
    PROCESSED = 'PROCESSED',
    FAILED = 'FAILED'
}

interface OrderClaimAttributes {
    id: string;
    campaign_id: string;
    buyer_id: string;
    expected_payout_amount: number;
    amazon_order_id: string;
    order_proof_url: string;
    purchase_date: Date;
    order_status: OrderStatus;
    review_proof_url?: string;
    review_rating?: number;
    review_text?: string;
    amazon_review_id?: string;
    review_date?: Date;
    review_status: ReviewStatus;
    review_deadline?: Date;
    rejection_reason?: string;
    verified_by_admin_id?: string;
    payout_status: PayoutStatus;
    created_at?: Date;
    deleted_at?: Date;
}

type OrderClaimCreationAttributes = Optional<OrderClaimAttributes, 'id' | 'order_status' | 'review_status' | 'payout_status' | 'created_at' | 'review_proof_url' | 'review_rating' | 'review_text' | 'amazon_review_id' | 'review_date' | 'review_deadline' | 'rejection_reason' | 'verified_by_admin_id' | 'deleted_at'>;

export class OrderClaim extends Model<OrderClaimAttributes, OrderClaimCreationAttributes> implements OrderClaimAttributes {
    public id!: string;
    public campaign_id!: string;
    public buyer_id!: string;
    public expected_payout_amount!: number;
    public amazon_order_id!: string;
    public order_proof_url!: string;
    public purchase_date!: Date;
    public order_status!: OrderStatus;
    public review_proof_url!: string;
    public review_rating!: number;
    public review_text!: string;
    public amazon_review_id!: string;
    public review_date!: Date;
    public review_status!: ReviewStatus;
    public review_deadline!: Date;
    public rejection_reason!: string;
    public verified_by_admin_id!: string;
    public payout_status!: PayoutStatus;
    public created_at!: Date;
    public deleted_at!: Date;
}

OrderClaim.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        campaign_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        buyer_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        expected_payout_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        amazon_order_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        order_proof_url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        purchase_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        order_status: {
            type: DataTypes.ENUM(...Object.values(OrderStatus)),
            defaultValue: OrderStatus.PENDING_VERIFICATION,
            allowNull: false
        },
        review_proof_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        review_rating: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        review_text: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        amazon_review_id: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        review_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        review_status: {
            type: DataTypes.ENUM(...Object.values(ReviewStatus)),
            defaultValue: ReviewStatus.AWAITING_UPLOAD,
            allowNull: false
        },
        review_deadline: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        verified_by_admin_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        payout_status: {
            type: DataTypes.ENUM(...Object.values(PayoutStatus)),
            defaultValue: PayoutStatus.NOT_ELIGIBLE,
            allowNull: false
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
        tableName: 'order_claims',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['campaign_id', 'buyer_id'],
                name: 'one_claim_per_product_per_buyer'
            }
        ]
    }
);

export default OrderClaim;
