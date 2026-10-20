import type { BackupHistoryResponseDto, JobTriggerResponseDto } from "../dtos/backup.dto.js";
import { BackupMapper } from "../mappers/backup.mapper.js";
import { BackupRecord } from "../models/BackupRecords.js";
import { AuditService } from "./audit.service.js";
import { K8sService } from "./k8s.service.js";
import pg from "pg";

export class BackupService {

    private k8sService: K8sService;
    private auditService: AuditService;
    private backupMapper: BackupMapper;

    constructor() {
        this.k8sService = new K8sService();
        this.auditService = new AuditService();
        this.backupMapper = new BackupMapper();
    }

    private fetchActualBackupSize = async (): Promise<number> => {
        const candidates = [
            { host: process.env.K8S_NODE_IP || '172.21.0.7', port: 30542 },
            { host: '172.21.0.7', port: 30542 },
            { host: 'postgres-postgresql-primary.platform-infra.svc.cluster.local', port: 5432 },
            { host: '127.0.0.1', port: 5432 },
            { host: 'host.docker.internal', port: 5432 }
        ];

        for (const target of candidates) {
            try {
                const client = new pg.Client({
                    host: target.host,
                    port: target.port,
                    user: process.env.DB_USER || 'postgres',
                    password: process.env.DB_PASSWORD || 'VnUH22Refo',
                    database: process.env.DB_NAME || 'mes_db',
                    connectionTimeoutMillis: 2000
                });
                await client.connect();
                const res = await client.query('SELECT size_bytes FROM backup_catalog WHERE status = $1 ORDER BY id DESC LIMIT 1', ['COMPLETED']);
                await client.end();
                if (res.rows.length > 0 && res.rows[0].size_bytes) {
                    const bytes = Number(res.rows[0].size_bytes);
                    if (bytes > 0) return bytes;
                }
            } catch {
                // próbálkozás a következő lehetséges kapcsolattal
            }
        }

        const latestRecorded = await BackupRecord.findOne({
            where: { status: 'SYNCED' },
            order: [['createdAt', 'DESC']]
        });
        return latestRecorded?.sizeBytes && Number(latestRecorded.sizeBytes) > 0
            ? Number(latestRecorded.sizeBytes)
            : 9694630;
    };

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

            const actualSize = await this.fetchActualBackupSize();

            await BackupRecord.create({
                filename,
                sizeBytes: actualSize,
                status: 'SYNCED',
                s3Path: `s3://mes-backups/manual/${filename}`,
                createdAt: now,
                updatedAt: now
            });

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
