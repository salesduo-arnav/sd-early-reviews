import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export enum TransactionType {
    SELLER_CHARGE = 'SELLER_CHARGE',
    BUYER_PAYOUT = 'BUYER_PAYOUT',
    REFUND = 'REFUND'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED'
}

interface TransactionAttributes {
    id: string;
    user_id: string;
    gross_amount: number;
    platform_fee: number;
    net_amount: number;
    type: TransactionType;
    stripe_transaction_id: string;
    receipt_url?: string;
    invoice_url?: string;
    status: TransactionStatus;
    created_at?: Date;
    deleted_at?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'status' | 'created_at' | 'receipt_url' | 'invoice_url' | 'deleted_at'> { }

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
    public id!: string;
    public user_id!: string;
    public gross_amount!: number;
    public platform_fee!: number;
    public net_amount!: number;
    public type!: TransactionType;
    public stripe_transaction_id!: string;
    public receipt_url!: string;
    public invoice_url!: string;
    public status!: TransactionStatus;
    public created_at!: Date;
    public deleted_at!: Date;
}

Transaction.init(
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
        gross_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        platform_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        net_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(TransactionType)),
            allowNull: false,
        },
        stripe_transaction_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        receipt_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        invoice_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(TransactionStatus)),
            defaultValue: TransactionStatus.PENDING,
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
        tableName: 'transactions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default Transaction;
