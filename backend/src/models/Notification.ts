import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export enum NotificationType {
    SYSTEM = 'SYSTEM',
    VERIFICATION_UPDATE = 'VERIFICATION_UPDATE',
    PAYOUT_ALERT = 'PAYOUT_ALERT',
    CAMPAIGN_UPDATE = 'CAMPAIGN_UPDATE',
    ACTION_REQUIRED = 'ACTION_REQUIRED'
}

interface NotificationAttributes {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    action_link?: string;
    is_read: boolean;
    created_at?: Date;
    deleted_at?: Date;
}

type NotificationCreationAttributes = Optional<NotificationAttributes, 'id' | 'type' | 'is_read' | 'created_at' | 'action_link' | 'deleted_at'>;

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: string;
    public user_id!: string;
    public type!: NotificationType;
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
        type: {
            type: DataTypes.ENUM(...Object.values(NotificationType)),
            defaultValue: NotificationType.SYSTEM,
            allowNull: false
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
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default Notification;
