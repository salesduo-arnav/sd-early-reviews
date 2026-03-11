import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface AdminAuditLogAttributes {
    id: string;
    admin_id: string;
    action: string;
    target_id: string;
    target_type?: string;
    details?: string;
    ip_address?: string;
    created_at?: Date;
    deleted_at?: Date;
}

type AdminAuditLogCreationAttributes = Optional<AdminAuditLogAttributes, 'id' | 'target_type' | 'details' | 'ip_address' | 'created_at' | 'deleted_at'>;

export class AdminAuditLog extends Model<AdminAuditLogAttributes, AdminAuditLogCreationAttributes> implements AdminAuditLogAttributes {
    public id!: string;
    public admin_id!: string;
    public action!: string;
    public target_id!: string;
    public target_type!: string;
    public details!: string;
    public ip_address!: string;
    public created_at!: Date;
    public deleted_at!: Date;
}

AdminAuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        admin_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        target_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        target_type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ip_address: {
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
        tableName: 'admin_audit_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default AdminAuditLog;
