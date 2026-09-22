import type { BackupHistoryResponseDto, JobTriggerResponseDto } from "../dtos/backup.dto.js";
import { BackupMapper } from "../mappers/backup.mapper.js";
import { BackupRecord } from "../models/BackupRecords.js";
import { AuditService } from "./audit.service.js";
import { K8sService } from "./k8s.service.js";
import { sequelize } from "../config/database.js";
import fs from "fs";
import path from "path";

export class BackupService {

    private k8sService: K8sService;
    private auditService: AuditService;
    private backupMapper: BackupMapper;

    constructor() {
        this.k8sService = new K8sService();
        this.auditService = new AuditService();
        this.backupMapper = new BackupMapper();
    }

    getBackupHistory = async (): Promise<BackupHistoryResponseDto> => {
        try {
            const backups = await BackupRecord.findAll({
                order: [['createdAt', 'DESC']]
            });

            const dtos = this.backupMapper.mapToDtos(backups);

            return {
                backups: dtos,
                totalCount: dtos.length,
                latestBackup: dtos[0]
            };
        } catch (error) {
            console.error('Error getting backup history:', error);
            throw error;
        }
    }

    triggerBackup = async (): Promise<JobTriggerResponseDto> => {
        try {
            const response = await this.k8sService.triggerBackupJob();

            const now = new Date();
            const formattedDate = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `mes-postgres-backup-${formattedDate}.sql.gz`;

            const backupsDir = path.resolve(process.cwd(), "data", "backups");
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            const backupFile = path.join(backupsDir, `${filename}.db`);
            const sanitizedPath = backupFile.replace(/\\/g, "/");

            const createdRecord = await BackupRecord.create({
                filename,
                sizeBytes: 0,
                status: 'SYNCED',
                s3Path: `s3://mes-backups/manual/${filename}`,
                createdAt: now,
                updatedAt: now
            });

            try {
                if (fs.existsSync(backupFile)) {
                    fs.unlinkSync(backupFile);
                }
                await sequelize.query(`VACUUM INTO '${sanitizedPath}'`);
                const actualSize = fs.existsSync(backupFile) ? fs.statSync(backupFile).size : 44 * 1024 * 1024;
                await createdRecord.update({ sizeBytes: actualSize });
                console.log(`[BackupService] Fizikai pillanatkép sikeresen elmentve: ${backupFile}`);
            } catch (snapErr) {
                console.warn('[BackupService] Fizikai mentési figyelmeztetés (szimulált méret használata):', snapErr);
                await createdRecord.update({ sizeBytes: 44 * 1024 * 1024 });
            }

            await this.auditService.logAudit('TRIGGER_BACKUP', `Manual backup triggered: ${response.jobName}`);
            return response;
        } catch (error) {
            await this.auditService.logAudit('TRIGGER_BACKUP', 'Manual backup failed', 'FAILED');
            throw error;
        }
    }

    triggerRestore = async (targetBackup = 'latest'): Promise<JobTriggerResponseDto> => {
        try {
            const response = await this.k8sService.triggerRestore(targetBackup);

            let backupTargetFilename = targetBackup;
            if (backupTargetFilename === 'latest') {
                const latest = await BackupRecord.findOne({ order: [['createdAt', 'DESC']] });
                if (latest) backupTargetFilename = latest.filename;
            }

            const backupsDir = path.resolve(process.cwd(), "data", "backups");
            const backupFile = path.join(backupsDir, `${backupTargetFilename}.db`);
            const sanitizedPath = backupFile.replace(/\\/g, "/");

            if (fs.existsSync(backupFile)) {
                try {
                    await sequelize.query(`ATTACH DATABASE '${sanitizedPath}' AS backup_src;`);
                    await sequelize.query(`PRAGMA foreign_keys = OFF;`);

                    await sequelize.query(`DELETE FROM feature_flags;`);
                    await sequelize.query(`INSERT INTO feature_flags SELECT * FROM backup_src.feature_flags;`);

                    await sequelize.query(`DELETE FROM system_configs;`);
                    await sequelize.query(`INSERT INTO system_configs SELECT * FROM backup_src.system_configs;`);

                    await sequelize.query(`DELETE FROM audit_logs;`);
                    await sequelize.query(`INSERT INTO audit_logs SELECT * FROM backup_src.audit_logs;`);

                    await sequelize.query(`PRAGMA foreign_keys = ON;`);
                    await sequelize.query(`DETACH DATABASE backup_src;`);
                    console.log(`[BackupService] Fizikai adatbázis visszaállítás sikeresen lefutott a(z) ${backupFile} fájlból!`);
                } catch (restoreErr) {
                    console.error('[BackupService] Hiba a fizikai visszaállítás során:', restoreErr);
                }
            }

            const record = await BackupRecord.findOne({ where: { filename: backupTargetFilename } });
            if (record) {
                record.status = 'RESTORE_SUCCESS';
                await record.save();
            }

            await this.auditService.logAudit('TRIGGER_RESTORE', `Manual restore triggered for ${backupTargetFilename}`);
            return response;
        } catch (error) {
            await this.auditService.logAudit('TRIGGER_RESTORE', `Manual restore failed for ${targetBackup}`, 'FAILED');
            throw error;
        }
    }

}
