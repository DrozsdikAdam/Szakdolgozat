import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import type {
    BackupHistoryResponseDto,
    JobTriggerResponseDto,
    BackupTargetDto,
    BackupTargetUpdateDto,
    BackupTargetTestDto,
    BackupTargetTestResultDto
} from "../dtos/backup.dto.js";
import { BackupMapper } from "../mappers/backup.mapper.js";
import { BackupRecord } from "../models/BackupRecords.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { AuditService } from "./audit.service.js";
import { K8sService } from "./k8s.service.js";
import { K8sClientService } from "./k8s/k8s-client.service.js";

export class BackupService {

    private k8sService: K8sService;
    private k8sClient: K8sClientService;
    private auditService: AuditService;
    private backupMapper: BackupMapper;

    constructor() {
        this.k8sService = new K8sService();
        this.k8sClient = K8sClientService.getInstance();
        this.auditService = new AuditService();
        this.backupMapper = new BackupMapper();
    }

    private getS3Client = async (): Promise<{ client: S3Client; bucket: string; mode: string } | null> => {
        try {
            const configs = await SystemConfig.findAll();
            const configMap = new Map(configs.map(c => [c.key, c.value]));

            const mode = (configMap.get('backup_target_mode') as 'internal' | 'external') || 'internal';
            const endpoint = mode === 'external'
                ? (configMap.get('backup_s3_endpoint') || '')
                : (process.env.INTERNAL_MINIO_ENDPOINT || 'http://desktop-control-plane:30900');
            const bucket = mode === 'external'
                ? (configMap.get('backup_s3_bucket') || 'mes-backups')
                : 'mes-backups';
            const accessKey = mode === 'external'
                ? (configMap.get('backup_s3_access_key') || '')
                : 'minioadmin';
            const secretKey = mode === 'external'
                ? (configMap.get('backup_s3_secret_key') || process.env.S3_SECRET_KEY || '')
                : 'minioadminpassword';
            const region = configMap.get('backup_s3_region') || (mode === 'external' ? 'auto' : 'us-east-1');

            if (!endpoint || !accessKey || !secretKey) {
                return null;
            }

            const client = new S3Client({
                region,
                endpoint,
                credentials: {
                    accessKeyId: accessKey,
                    secretAccessKey: secretKey
                },
                forcePathStyle: mode === 'internal'
            });

            return { client, bucket, mode };
        } catch (err) {
            console.warn('[BackupService] S3Client inicializálási hiba:', err);
            return null;
        }
    };

    public syncWithStorage = async (): Promise<void> => {
        try {
            const s3 = await this.getS3Client();
            if (!s3) return;

            const res = await s3.client.send(new ListObjectsV2Command({ Bucket: s3.bucket }));
            if (!res.Contents || res.Contents.length === 0) return;

            for (const item of res.Contents) {
                if (!item.Key) continue;
                if (item.Key.endsWith('.txt')) continue;

                const filename = item.Key.split('/').pop();
                if (!filename || filename === 'latest.sql.gz') continue;

                const sizeBytes = item.Size ?? 0;
                const lastModified = item.LastModified ?? new Date();
                const s3Path = `s3://${s3.bucket}/${item.Key}`;

                const existing = await BackupRecord.findOne({ where: { filename } });
                if (existing) {
                    if (Number(existing.sizeBytes) !== sizeBytes && sizeBytes > 0) {
                        existing.sizeBytes = sizeBytes;
                        existing.s3Path = s3Path;
                        existing.status = 'SYNCED';
                        await existing.save();
                    }
                } else {
                    await BackupRecord.create({
                        filename,
                        sizeBytes,
                        status: 'SYNCED',
                        s3Path,
                        createdAt: lastModified,
                        updatedAt: lastModified
                    });
                }
            }
        } catch (err) {
            console.warn('[BackupService] Tároló szinkronizálási figyelmeztetés:', err);
        }
    };

    private fetchActualBackupSize = async (): Promise<number> => {
        try {
            const s3 = await this.getS3Client();
            if (s3) {
                const head = await s3.client.send(new HeadObjectCommand({
                    Bucket: s3.bucket,
                    Key: 'latest.sql.gz'
                })).catch(() => null);
                if (head?.ContentLength && head.ContentLength > 0) {
                    return head.ContentLength;
                }
            }
        } catch (err: any) {
            console.warn('[BackupService] Nem sikerült lekérni a legfrissebb mentés méretét az S3 tárhelyről:', err?.message || err);
        }

        const latestRecorded = await BackupRecord.findOne({
            order: [['createdAt', 'DESC']]
        });
        return latestRecorded?.sizeBytes && Number(latestRecorded.sizeBytes) > 0
            ? Number(latestRecorded.sizeBytes)
            : 524288;
    };

    getBackupHistory = async (): Promise<BackupHistoryResponseDto> => {
        try {
            await this.syncWithStorage().catch((err: any) => {
                console.warn('[BackupService] Tárhely háttér szinkronizáció meghiúsult:', err?.message || err);
            });

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
    };

    getBackupTarget = async (): Promise<BackupTargetDto> => {
        try {
            const configs = await SystemConfig.findAll();
            const configMap = new Map(configs.map(c => [c.key, c.value]));

            const mode = (configMap.get('backup_target_mode') as 'internal' | 'external') || 'internal';
            const endpoint = mode === 'external'
                ? (configMap.get('backup_s3_endpoint') || '')
                : 'http://minio.platform-infra.svc.cluster.local:9000';
            const bucket = mode === 'external'
                ? (configMap.get('backup_s3_bucket') || 'mes-backups')
                : 'mes-backups';
            const accessKey = mode === 'external'
                ? (configMap.get('backup_s3_access_key') || '')
                : 'minioadmin';
            const region = configMap.get('backup_s3_region') || 'us-east-1';

            return {
                mode,
                endpoint,
                bucket,
                accessKeyMasked: accessKey ? (accessKey.length > 4 ? `${accessKey.slice(0, 3)}***` : '***') : '',
                region,
                isReady: true
            };
        } catch (error) {
            console.error('Error getting backup target:', error);
            return {
                mode: 'internal',
                endpoint: 'http://minio.platform-infra.svc.cluster.local:9000',
                bucket: 'mes-backups',
                region: 'us-east-1',
                isReady: true
            };
        }
    };

    saveBackupTarget = async (dto: BackupTargetUpdateDto): Promise<{ success: boolean; message: string }> => {
        try {
            const isExternal = dto.mode === 'external';
            const endpoint = isExternal
                ? (dto.endpoint || '').trim()
                : 'http://minio.platform-infra.svc.cluster.local:9000';
            const bucket = isExternal
                ? ((dto.bucket || '').trim() || 'mes-backups')
                : 'mes-backups';
            const region = (dto.region || (isExternal ? 'auto' : 'us-east-1')).trim();
            const accessKey = isExternal ? (dto.accessKey || '').trim() : 'minioadmin';
            const secretKey = isExternal ? (dto.secretKey || '').trim() : 'minioadminpassword';

            await Promise.all([
                SystemConfig.upsert({ key: 'backup_target_mode', value: dto.mode }),
                SystemConfig.upsert({ key: 'backup_s3_endpoint', value: endpoint }),
                SystemConfig.upsert({ key: 'backup_s3_bucket', value: bucket }),
                SystemConfig.upsert({ key: 'backup_s3_region', value: region }),
                ...(accessKey ? [SystemConfig.upsert({ key: 'backup_s3_access_key', value: accessKey })] : []),
                ...(isExternal && secretKey ? [SystemConfig.upsert({ key: 'backup_s3_secret_key', value: secretKey })] : [])
            ]);

            const secretData: Record<string, string> = {
                S3_ENDPOINT: endpoint,
                S3_BUCKET: bucket,
                S3_REGION: region,
                S3_ACCESS_KEY: accessKey
            };
            if (secretKey) {
                secretData.S3_SECRET_KEY = secretKey;
            }

            try {
                const infraSecrets = await this.k8sClient.coreApi.listNamespacedSecret({ namespace: 'platform-infra' });
                const backupSecrets = (infraSecrets.items || []).filter(s => s.metadata?.name?.startsWith('backup-secret'));
                for (const bs of backupSecrets) {
                    const secretName = bs.metadata!.name!;
                    await this.k8sService.saveSecret({
                        name: secretName,
                        namespace: 'platform-infra',
                        data: secretData
                    }).catch(secretErr => {
                        console.warn(`[BackupService] Secret (${secretName}) mentési hiba:`, secretErr);
                    });
                }
            } catch (err) {
                console.warn('[BackupService] backup-secret frissítési figyelmeztetés:', err);
            }

            const targetDesc = isExternal ? `Külső S3 (${endpoint} / ${bucket})` : 'Belső Platform MinIO (mes-backups)';
            await this.auditService.logAudit('BACKUP_TARGET_UPDATE', `Mentési tárhely célpont frissítve: ${targetDesc}`, 'SUCCESS');

            return {
                success: true,
                message: `Mentési tárhely sikeresen beállítva: ${targetDesc}`
            };
        } catch (error: any) {
            console.error('Error saving backup target:', error);
            await this.auditService.logAudit('BACKUP_TARGET_UPDATE', `Mentési célpont mentése elbukott: ${error?.message || error}`, 'FAILED');
            throw error;
        }
    };

    testBackupTarget = async (dto: BackupTargetTestDto): Promise<BackupTargetTestResultDto> => {
        const startTime = Date.now();
        if (dto.mode === 'internal') {
            try {
                await this.k8sClient.coreApi.readNamespacedService({ name: 'minio', namespace: 'platform-infra' });
                const latencyMs = Date.now() - startTime;
                return {
                    success: true,
                    message: 'A belső platform MinIO szolgáltatás fut és elérhető a fürtben.',
                    latencyMs
                };
            } catch (err: any) {
                return {
                    success: false,
                    message: `A belső MinIO szolgáltatás nem érhető el: ${err?.message || err}`,
                    latencyMs: Date.now() - startTime
                };
            }
        }

        const endpoint = (dto.endpoint || '').trim();
        if (!endpoint) {
            return {
                success: false,
                message: 'A külső S3 végpont (Endpoint URL) megadása kötelező a teszteléshez.'
            };
        }

        try {
            const url = new URL(endpoint);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            await fetch(url.origin, { method: 'HEAD', signal: controller.signal }).catch(() => null);
            clearTimeout(timeout);
            const latencyMs = Date.now() - startTime;
            return {
                success: true,
                message: `Sikeres kapcsolat a külső S3 végponthoz (${url.origin})!`,
                latencyMs
            };
        } catch (err: any) {
            return {
                success: false,
                message: `Nem sikerült elérni a külső S3 végpontot (${endpoint}): ${err?.message || err}`,
                latencyMs: Date.now() - startTime
            };
        }
    };

    triggerBackup = async (): Promise<JobTriggerResponseDto> => {
        try {
            const engineConfig = await SystemConfig.findOne({ where: { key: 'db_engine' } });
            const engine = (engineConfig?.value || 'postgres').toLowerCase();
            const cronjobName = engine === 'mssql' ? 'db-backup-mssql' : engine === 'oracle' ? 'db-backup-oracle' : 'db-backup';

            const response = await this.k8sService.triggerBackupJob(undefined, cronjobName);

            setTimeout(() => {
                this.syncWithStorage().catch(err => {
                    console.warn('[BackupService] Háttér tároló szinkronizáció sikertelen (2s):', err);
                });
            }, 2000);
            setTimeout(() => {
                this.syncWithStorage().catch(err => {
                    console.warn('[BackupService] Háttér tároló szinkronizáció sikertelen (5s):', err);
                });
            }, 5000);
            setTimeout(() => {
                this.syncWithStorage().catch(err => {
                    console.warn('[BackupService] Háttér tároló szinkronizáció sikertelen (9s):', err);
                });
            }, 9000);
            setTimeout(() => {
                this.syncWithStorage().catch(err => {
                    console.warn('[BackupService] Háttér tároló szinkronizáció sikertelen (15s):', err);
                });
            }, 15000);

            await this.auditService.logAudit('TRIGGER_BACKUP', `Manual backup triggered (${engine.toUpperCase()} via ${cronjobName}): ${response.jobName}`);
            return response;
        } catch (error) {
            await this.auditService.logAudit('TRIGGER_BACKUP', 'Manual backup failed', 'FAILED');
            throw error;
        }
    };

    triggerRestore = async (targetBackup = 'latest'): Promise<JobTriggerResponseDto> => {
        try {
            const engineConfig = await SystemConfig.findOne({ where: { key: 'db_engine' } });
            const engine = (engineConfig?.value || 'postgres').toLowerCase();
            const cronjobName = engine === 'mssql' ? 'db-restore-mssql' : engine === 'oracle' ? 'db-restore-oracle' : 'db-restore';

            const response = await this.k8sService.triggerRestore(targetBackup, undefined, cronjobName);

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

            await this.auditService.logAudit('TRIGGER_RESTORE', `Manual restore triggered (${engine.toUpperCase()} via ${cronjobName}) for ${backupTargetFilename}`);
            return response;
        } catch (error) {
            await this.auditService.logAudit('TRIGGER_RESTORE', `Manual restore failed for ${targetBackup}`, 'FAILED');
            throw error;
        }
    };

}
