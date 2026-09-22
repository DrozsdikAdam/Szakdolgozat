import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import type { FeatureFlagName } from "../types/feature.types.js";

export class FeatureFlag extends Model {

    declare id: string;
    declare name: FeatureFlagName;
    declare enabled: boolean;
    declare params: Record<string, unknown>;
}

FeatureFlag.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        params: {
            type: DataTypes.JSON,
            defaultValue: {}
        }
    },
    {
        sequelize,
        tableName: "feature_flags",
        modelName: "FeatureFlag",
        timestamps: true
    }
);