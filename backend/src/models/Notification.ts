import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

export enum NotificationCategory {
    // Buyer-facing
    NEW_CAMPAIGN_MATCH = 'NEW_CAMPAIGN_MATCH',
    ORDER_APPROVED = 'ORDER_APPROVED',
    ORDER_REJECTED = 'ORDER_REJECTED',
    REVIEW_APPROVED = 'REVIEW_APPROVED',
    REVIEW_REJECTED = 'REVIEW_REJECTED',
    PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
    PAYOUT_FAILED = 'PAYOUT_FAILED',
    REVIEW_DEADLINE = 'REVIEW_DEADLINE',

    // Seller-facing
    CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',
    CAMPAIGN_PAUSED = 'CAMPAIGN_PAUSED',
    CAMPAIGN_COMPLETED = 'CAMPAIGN_COMPLETED',
    NEW_ORDER_CLAIM = 'NEW_ORDER_CLAIM',
    REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
    SELLER_PAYMENT_DUE = 'SELLER_PAYMENT_DUE',

    // Admin-facing
    ADMIN_VERIFICATION_NEEDED = 'ADMIN_VERIFICATION_NEEDED',
    ADMIN_FLAGGED_USER = 'ADMIN_FLAGGED_USER',

    // Shared
    SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
    WELCOME = 'WELCOME',
}

export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

interface NotificationAttributes {
    id: string;
    user_id: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    title: string;
    message: string;
    action_link?: string;
    is_read: boolean;
    created_at?: Date;
    deleted_at?: Date;
}

type NotificationCreationAttributes = Optional<NotificationAttributes, 'id' | 'category' | 'priority' | 'is_read' | 'created_at' | 'action_link' | 'deleted_at'>;

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: string;
    public user_id!: string;
    public category!: NotificationCategory;
    public priority!: NotificationPriority;
    public title!: string;
    public message!: string;
    public action_link!: string;
    public is_read!: boolean;
    public created_at!: Date;
    public deleted_at!: Date;
}

Notification.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        category: {
            type: DataTypes.ENUM(...Object.values(NotificationCategory)),
            defaultValue: NotificationCategory.SYSTEM_ANNOUNCEMENT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM(...Object.values(NotificationPriority)),
            defaultValue: NotificationPriority.LOW,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        action_link: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
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
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default Notification;
