import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export enum UserRole {
    SELLER = 'SELLER',
    BUYER = 'BUYER',
    ADMIN = 'ADMIN'
}

interface UserAttributes {
    id: string;
    email: string;
    password_hash: string;
    role: UserRole;
    created_at?: Date;
    deleted_at?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'created_at'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public email!: string;
    public password_hash!: string;
    public role!: UserRole;
    public created_at!: Date;
    public deleted_at!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
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
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        paranoid: true,
    }
);

export default User;
