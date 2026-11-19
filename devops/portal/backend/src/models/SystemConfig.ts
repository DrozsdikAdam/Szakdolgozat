import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import type { SystemConfigKey } from "../types/setup.types.js";

export class SystemConfig extends Model {
    declare key: SystemConfigKey;
    declare value: string;
}

SystemConfig.init(
    {
        key: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: "system_configs",
        modelName: "SystemConfig",
        timestamps: true
    }
);