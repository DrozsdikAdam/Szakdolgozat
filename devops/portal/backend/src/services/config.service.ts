import { sequelize } from "../config/database.js";
import type { FeatureTogglePayload } from "../dtos/feature.dto.js";
import type { SetupWizardPayload } from "../dtos/setup.dto.js";
import type { PlatformStatusResponse } from "../dtos/status.dto.js";
import { BackupRecord } from "../models/BackupRecords.js";
import { FeatureFlag } from "../models/FeatureFlag.js";
import { SystemConfig } from "../models/SystemConfig.js";
import type { FeatureFlagName } from "../types/feature.types.js";
import type { DatabaseEngine, DatabaseMode, GitProvider, InstanceSize, S3Provider } from "../types/setup.types.js";
import { AuditService } from "./audit.service.js";
import { K8sService } from "./k8s.service.js";

export class ConfigService {

    private auditService: AuditService;
    private k8sService: K8sService;

    constructor() {
        this.auditService = new AuditService();
        this.k8sService = new K8sService();
    }

    initDatabase = async (): Promise<void> => {
        try {
            await sequelize.sync();

            const options: FeatureFlagName[] = ['rate_limiting', 'pgbouncer', 'haproxy', 'cronjob_backup', 'hpa_scaling', 'vpa_scaling', 'maintenance_mode'];

            for (const option of options) {
                await FeatureFlag.findOrCreate({
                    where: {
                        name: option
                    },
                    defaults: {
                        name: option,
                        enabled: false
                    }
                });
            }

            const backupCount = await BackupRecord.count();
            if (backupCount === 0) {
                const now = Date.now();
                await BackupRecord.bulkCreate([
                    {
                        filename: 'mes-postgres-backup-2026-09-15T02-00-00.sql.gz',
                        sizeBytes: 44236800, // ~42.19 MB
                        status: 'SYNCED',
                        s3Path: 's3://mes-backups/daily/mes-postgres-backup-2026-09-15T02-00-00.sql.gz',
                        createdAt: new Date(now - 1000 * 60 * 60 * 12),
                        updatedAt: new Date(now - 1000 * 60 * 60 * 12)
                    },
                    {
                        filename: 'mes-postgres-backup-2026-09-14T02-00-00.sql.gz',
                        sizeBytes: 43812000, // ~41.78 MB
                        status: 'SYNCED',
                        s3Path: 's3://mes-backups/daily/mes-postgres-backup-2026-09-14T02-00-00.sql.gz',
                        createdAt: new Date(now - 1000 * 60 * 60 * 36),
                        updatedAt: new Date(now - 1000 * 60 * 60 * 36)
                    },
                    {
                        filename: 'mes-postgres-backup-2026-09-13T02-00-00.sql.gz',
                        sizeBytes: 42991616, // ~41.00 MB
                        status: 'STAGED_LOCALLY',
                        s3Path: 's3://mes-backups/daily/mes-postgres-backup-2026-09-13T02-00-00.sql.gz',
                        createdAt: new Date(now - 1000 * 60 * 60 * 60),
                        updatedAt: new Date(now - 1000 * 60 * 60 * 60)
                    },
                    {
                        filename: 'mes-postgres-backup-2026-09-12T02-00-00.sql.gz',
                        sizeBytes: 41943040, // ~40.00 MB
                        status: 'RESTORE_SUCCESS',
                        s3Path: 's3://mes-backups/daily/mes-postgres-backup-2026-09-12T02-00-00.sql.gz',
                        createdAt: new Date(now - 1000 * 60 * 60 * 84),
                        updatedAt: new Date(now - 1000 * 60 * 60 * 84)
                    }
                ]);
                console.log('[ConfigService] Initial backup records seeded successfully.');
            }

            console.log('Database connection has been established successfully.');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    getPlatformStatus = async (): Promise<PlatformStatusResponse> => {
        try {
            const configs = await SystemConfig.findAll();
            const configMap = new Map(configs.map(c => [c.key, c.value]));
            const flags = await FeatureFlag.findAll();

            const activeFeatures = flags.reduce((acc, flag) => {
                acc[flag.name] = flag.enabled;
                return acc;
            }, {} as Record<FeatureFlagName, boolean>);

            const response: PlatformStatusResponse = {
                isInitialized: configMap.get('is_initialized') === 'true',
                gitProvider: configMap.get('git_provider') as GitProvider,
                repoUrl: configMap.get('repo_url') as string,
                dbEngine: (configMap.get('db_engine') as DatabaseEngine) || 'postgres',
                dbMode: configMap.get('db_mode') as DatabaseMode,
                s3Provider: configMap.get('s3_provider') as S3Provider,
                instanceSize: (configMap.get('instance_size') as InstanceSize) || 'small',
                activeFeatures: activeFeatures
            }

            return response;
        } catch (error) {
            console.error('Error getting platform status:', error);
            throw error;
        }
    }

    saveSetupWizard = async (request: SetupWizardPayload): Promise<void> => {
        try {
            const engine = request.dbEngine ?? 'postgres';
            const size = request.instanceSize ?? 'small';
            const map: Record<string, string> = {
                'is_initialized': 'true',
                'git_provider': request.gitProvider,
                'repo_url': request.repoUrl,
                'db_mode': request.dbMode,
                'db_engine': engine,
                's3_provider': request.s3Provider,
                's3_bucket': request.s3Bucket ?? 'mes-backups',
                's3_bucket_size': request.s3BucketSize ?? '5Gi',
                'instance_size': size
            }

            await Promise.all(
                Object.entries(map).map(([key, value]) =>
                    SystemConfig.upsert({ key: key as any, value })
                )
            );

            await Promise.all(request.enabledFeatures.map(async (feature) => {
                await FeatureFlag.update({ enabled: true }, {
                    where: { name: feature }
                })
            }));

            const dbResult = await this.k8sService.deployDatabaseEngine(engine, request.dbMode);
            await this.auditService.logAudit('SETUP_DATABASE_PROVISION', `Database provisioning (${engine}, ${request.dbMode}): ${dbResult.message}`, dbResult.success ? 'SUCCESS' : 'FAILED');

            // Ha nincs autoscaling, a választott statikus példányméretet (requests & limits) állítjuk be a podra
            const isAutoscalingActive = request.enabledFeatures.includes('hpa_scaling') || request.enabledFeatures.includes('vpa_scaling');
            if (!isAutoscalingActive) {
                const sizeResult = await this.k8sService.applyInstanceSize(size);
                await this.auditService.logAudit('SETUP_INSTANCE_SIZE', `Static instance sizing (${size}): ${sizeResult.message}`, sizeResult.success ? 'SUCCESS' : 'FAILED');
            }

            await this.auditService.logAudit('SETUP_WIZARD', 'Platform setup wizard completed');

        } catch (error) {
            await this.auditService.logAudit('SETUP_WIZARD', 'Platform setup wizard failed', 'FAILED');

            console.error('Error saving setup wizard:', error);
            throw error;
        }
    }

    toggleFeature = async (request: FeatureTogglePayload): Promise<FeatureFlag> => {
        try {
            const [flag] = await FeatureFlag.findOrCreate({ where: { name: request.name }, defaults: { name: request.name, enabled: request.enabled } });

            flag.enabled = request.enabled

            if (request.params) flag.params = request.params;

            await flag.save();

            await this.auditService.logAudit('TOGGLE_FEATURE', `Feature flag ${request.name} set to ${request.enabled}`);

            return flag;
        } catch (error) {
            await this.auditService.logAudit('TOGGLE_FEATURE', `Feature flag ${request.name} set to ${request.enabled}`, 'FAILED');

            console.error('Error toggling feature:', error);
            throw error;
        }
    }


}

