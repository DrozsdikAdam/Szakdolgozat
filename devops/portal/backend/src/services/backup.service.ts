import type { BackupHistoryResponseDto, JobTriggerResponseDto } from "../dtos/backup.dto.js";
import { BackupMapper } from "../mappers/backup.mapper.js";
import { BackupRecord } from "../models/BackupRecords.js";
import { AuditService } from "./audit.service.js";
import { K8sService } from "./k8s.service.js";

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
            await this.auditService.logAudit('TRIGGER_BACKUP', 'Manual backup triggered');
            return response;
        } catch (error) {
            await this.auditService.logAudit('TRIGGER_BACKUP', 'Manual backup failed', 'FAILED');
            throw error;
        }
    }

    triggerRestore = async (targetBackup = 'latest'): Promise<JobTriggerResponseDto> => {
        try {
            const response = await this.k8sService.triggerRestore(targetBackup);
            await this.auditService.logAudit('TRIGGER_RESTORE', `Manual restore triggered for ${targetBackup}`);
            return response;
        } catch (error) {
            await this.auditService.logAudit('TRIGGER_RESTORE', `Manual restore failed for ${targetBackup}`, 'FAILED');
            throw error;
        }
    }

}
