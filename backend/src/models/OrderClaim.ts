import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

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
    PROCESSING = 'PROCESSING',
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
    review_title?: string;
    review_text?: string;
    amazon_review_id?: string;
    review_date?: Date;
    review_status: ReviewStatus;
    review_deadline?: Date;
    rejection_reason?: string | null;
    verified_by_admin_id?: string;
    payout_status: PayoutStatus;
    verification_method?: string;
    verification_details?: Record<string, unknown>;
    auto_verified_at?: Date;
    review_verification_method?: string;
    review_verification_details?: Record<string, unknown>;
    review_auto_verified_at?: Date;
    review_approved_at?: Date;
    payout_processed_at?: Date;
    wise_transfer_id?: string;
    payout_method?: string;
    order_retry_count: number;
    review_retry_count: number;
    created_at?: Date;
    deleted_at?: Date;
}

type OrderClaimCreationAttributes = Optional<OrderClaimAttributes, 'id' | 'order_status' | 'review_status' | 'payout_status' | 'created_at' | 'review_proof_url' | 'review_rating' | 'review_title' | 'review_text' | 'amazon_review_id' | 'review_date' | 'review_deadline' | 'rejection_reason' | 'verified_by_admin_id' | 'verification_method' | 'verification_details' | 'auto_verified_at' | 'review_verification_method' | 'review_verification_details' | 'review_auto_verified_at' | 'review_approved_at' | 'payout_processed_at' | 'wise_transfer_id' | 'payout_method' | 'order_retry_count' | 'review_retry_count' | 'deleted_at'>;

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
    public review_title!: string;
    public review_text!: string;
    public amazon_review_id!: string;
    public review_date!: Date;
    public review_status!: ReviewStatus;
    public review_deadline!: Date;
    public rejection_reason!: string | null;
    public verified_by_admin_id!: string;
    public payout_status!: PayoutStatus;
    public verification_method!: string;
    public verification_details!: Record<string, unknown>;
    public auto_verified_at!: Date;
    public review_verification_method!: string;
    public review_verification_details!: Record<string, unknown>;
    public review_auto_verified_at!: Date;
    public review_approved_at!: Date;
    public payout_processed_at!: Date;
    public wise_transfer_id!: string;
    public payout_method!: string;
    public order_retry_count!: number;
    public review_retry_count!: number;
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
        review_title: {
            type: DataTypes.STRING,
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
        verification_method: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        verification_details: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        auto_verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        review_verification_method: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        review_verification_details: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        review_auto_verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        review_approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        payout_processed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        wise_transfer_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        payout_method: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        order_retry_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        review_retry_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
            },
            { fields: ['order_status'], name: 'idx_order_claims_order_status' },
            { fields: ['review_status'], name: 'idx_order_claims_review_status' },
            { fields: ['payout_status'], name: 'idx_order_claims_payout_status' },
        ]
    }
);

export default OrderClaim;
