import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface SystemConfigAttributes {
    key: string;
    value: string;
    description?: string;
    updated_at?: Date;
}

type SystemConfigCreationAttributes = Optional<SystemConfigAttributes, 'description' | 'updated_at'>;

export class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes>
    implements SystemConfigAttributes {
    public key!: string;
    public value!: string;
    public description!: string;
    public updated_at!: Date;
}

SystemConfig.init(
    {
        key: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'system_configs',
        timestamps: true,
        createdAt: false,
        updatedAt: 'updated_at',
    }
);

export default SystemConfig;
