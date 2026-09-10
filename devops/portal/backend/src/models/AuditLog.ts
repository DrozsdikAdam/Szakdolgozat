import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import type { AuditStatus } from "../types/Audit.types.js";

export class AuditLog extends Model {

    declare id: string;
    declare action: string;
    declare details: string;
    declare status: AuditStatus;

}

AuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        details: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('SUCCESS', 'FAILED'),
            defaultValue: "SUCCESS"
        }
    },
    {
        sequelize,
        tableName: "audit_logs",
        modelName: "AuditLog",
        timestamps: true
    }
);