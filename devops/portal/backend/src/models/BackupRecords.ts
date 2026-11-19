import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import type { BackupStatus } from "../types/backup.types.js";

export class BackupRecord extends Model {

    declare id: string;
    declare filename: string;
    declare sizeBytes: number;
    declare status: BackupStatus;
    declare s3Path: string;
    declare createdAt: Date;
    declare updatedAt: Date;

}

BackupRecord.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sizeBytes: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('STAGED_LOCALLY', 'SYNCED', 'RESTORE_COMPLETED', 'RESTORE_SUCCESS', 'FAILED'),
            defaultValue: 'STAGED_LOCALLY',
            allowNull: false
        },
        s3Path: {
            type: DataTypes.STRING,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: "backup_records",
        modelName: "BackupRecord",
        timestamps: true
    }
);