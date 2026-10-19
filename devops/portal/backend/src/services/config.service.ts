import { sequelize } from "../config/database.js";
import type { FeatureTogglePayload } from "../dtos/feature.dto.js";
import type { SetupWizardPayload } from "../dtos/setup.dto.js";
import type { PlatformStatusResponse } from "../dtos/status.dto.js";
import { BackupRecord } from "../models/BackupRecords.js";
import { FeatureFlag } from "../models/FeatureFlag.js";
import { SystemConfig } from "../models/SystemConfig.js";
import type { FeatureFlagName, InactivationStrategy, FeatureWorkloadTarget } from "../types/feature.types.js";
import type { DatabaseEngine, DatabaseMode, GitProvider, InstanceSize, S3Provider } from "../types/setup.types.js";
import { AuditService } from "./audit.service.js";
import { K8sService } from "./k8s.service.js";
import {
    DEFAULT_APP_NAMESPACE,
    DEFAULT_PLATFORM_NAMESPACE,
    DEFAULT_APP_NAME,
    DEFAULT_FRONTEND_NAME
} from "../constants/namespace.constants.js";

const FEATURE_WORKLOAD_MAP: Partial<Record<FeatureFlagName, FeatureWorkloadTarget>> = {
    pgbouncer: { type: 'deployment', name: 'pgbouncer', namespace: DEFAULT_PLATFORM_NAMESPACE },
    haproxy: { type: 'deployment', name: 'haproxy', namespace: DEFAULT_PLATFORM_NAMESPACE },
    cronjob_backup: { type: 'cronjob', name: 'db-backup', namespace: DEFAULT_PLATFORM_NAMESPACE },
};

const PLATFORM_FEATURE_DEFAULTS: Partial<Record<FeatureFlagName, Record<string, any>>> = {
    rate_limiting: { rps: 100, burst: 5 },
    hpa_scaling: { minReplicas: 2, maxReplicas: 6, targetCpuUtil: 70 },
    vpa_scaling: {
        updateMode: 'Auto',
        minAllowedCpu: '100m',
        maxAllowedCpu: '1000m',
        minAllowedMemory: '128Mi',
        maxAllowedMemory: '2Gi'
    },
    cronjob_backup: { schedule: '0 2 * * *' }
};

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

            const featureParams = flags.reduce((acc, flag) => {
                const defaults = PLATFORM_FEATURE_DEFAULTS[flag.name] || {};
                acc[flag.name] = { ...defaults, ...(flag.params || {}) };
                return acc;
            }, {} as Partial<Record<FeatureFlagName, Record<string, any>>>);

            const response: PlatformStatusResponse = {
                isInitialized: configMap.get('is_initialized') === 'true',
                gitProvider: configMap.get('git_provider') as GitProvider,
                repoUrl: configMap.get('repo_url') as string,
                dbEngine: (configMap.get('db_engine') as DatabaseEngine) || 'postgres',
                dbMode: configMap.get('db_mode') as DatabaseMode,
                s3Provider: configMap.get('s3_provider') as S3Provider,
                instanceSize: (configMap.get('instance_size') as InstanceSize) || 'small',
                inactivationStrategy: (configMap.get('inactivation_strategy') as InactivationStrategy) || 'scale_to_zero',
                activeFeatures: activeFeatures,
                featureParams: featureParams
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
            const strategy = request.inactivationStrategy ?? 'scale_to_zero';
            const map: Record<string, string> = {
                'is_initialized': 'true',
                'git_provider': request.gitProvider,
                'repo_url': request.repoUrl,
                'db_mode': request.dbMode,
                'db_engine': engine,
                's3_provider': request.s3Provider,
                's3_bucket': request.s3Bucket ?? 'mes-backups',
                's3_bucket_size': request.s3BucketSize ?? '5Gi',
                'instance_size': size,
                'inactivation_strategy': strategy
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

    private applyWorkloadStrategy = async (featureName: FeatureFlagName, enabled: boolean, strategy: InactivationStrategy): Promise<void> => {
        const target = FEATURE_WORKLOAD_MAP[featureName];
        if (!target) return;

        if (target.type === 'deployment') {
            const replicas = enabled ? 1 : (strategy === 'scale_to_zero' ? 0 : 1);
            await this.k8sService.scaleDeployment(target.name, target.namespace, replicas);
        } else if (target.type === 'cronjob') {
            const isSuspended = !enabled && strategy === 'scale_to_zero';
            await this.k8sService.setCronJobSuspended(target.name, target.namespace, isSuspended);
        }
    };

    toggleFeature = async (request: FeatureTogglePayload): Promise<FeatureFlag> => {
        try {
            const [flag] = await FeatureFlag.findOrCreate({
                where: { name: request.name },
                defaults: { name: request.name, enabled: request.enabled }
            });

            const strategy: InactivationStrategy = request.strategy || request.inactivationStrategy || (request.params?.strategy as InactivationStrategy) || 'scale_to_zero';
            const defaults = PLATFORM_FEATURE_DEFAULTS[request.name] || {};
            const mergedParams: Record<string, any> = { ...defaults, ...(flag.params || {}), ...(request.params || {}), strategy };

            flag.enabled = request.enabled;
            flag.params = mergedParams;
            await flag.save();

            if (request.name === 'rate_limiting') {
                if (request.enabled) {
                    await this.k8sService.updateRateLimit({
                        rps: Number(mergedParams.rps ?? 100),
                        burst: Number(mergedParams.burst ?? 5)
                    });
                } else {
                    await this.k8sService.updateRateLimit({ rps: 0, burst: 0 });
                }
            } else if (request.name === 'hpa_scaling') {
                if (request.enabled) {
                    await FeatureFlag.update({ enabled: false }, { where: { name: 'vpa_scaling' } });
                    await this.k8sService.updateVpa({
                        minAllowedCpu: '100m',
                        maxAllowedCpu: '1000m',
                        minAllowedMemory: '128Mi',
                        maxAllowedMemory: '2Gi',
                        updateMode: 'Off'
                    });

                    await this.k8sService.updateHpa({
                        minReplicas: Number(mergedParams.minReplicas ?? 2),
                        maxReplicas: Number(mergedParams.maxReplicas ?? 6),
                        targetCpuUtil: Number(mergedParams.targetCpuUtil ?? 70)
                    });
                } else {
                    await this.k8sService.scaleDeployment(DEFAULT_APP_NAME, DEFAULT_APP_NAMESPACE, 1);
                }
            } else if (request.name === 'vpa_scaling') {
                if (request.enabled) {
                    await FeatureFlag.update({ enabled: false }, { where: { name: 'hpa_scaling' } });
                    await this.k8sService.scaleDeployment(DEFAULT_APP_NAME, DEFAULT_APP_NAMESPACE, 1);
                }
                await this.k8sService.updateVpa({
                    minAllowedCpu: String(mergedParams.minAllowedCpu ?? '100m'),
                    maxAllowedCpu: String(mergedParams.maxAllowedCpu ?? '1000m'),
                    minAllowedMemory: String(mergedParams.minAllowedMemory ?? '128Mi'),
                    maxAllowedMemory: String(mergedParams.maxAllowedMemory ?? '2Gi'),
                    updateMode: request.enabled ? 'Auto' : 'Off'
                });
            } else if (request.name === 'maintenance_mode') {
                await this.k8sService.setMaintenanceMode(request.enabled);
                if (strategy === 'scale_to_zero') {
                    const targetReplicas = request.enabled ? 0 : 1;
                    await this.k8sService.scaleDeployment(DEFAULT_APP_NAME, DEFAULT_APP_NAMESPACE, targetReplicas).catch(() => { });
                    await this.k8sService.scaleDeployment(DEFAULT_FRONTEND_NAME, DEFAULT_APP_NAMESPACE, targetReplicas).catch(() => { });
                }
            } else {
                await this.applyWorkloadStrategy(request.name, request.enabled, strategy);
            }

            await this.auditService.logAudit(
                'TOGGLE_FEATURE',
                `Feature flag ${request.name} set to ${request.enabled} (Strategy: ${strategy})`
            );

            return flag;
        } catch (error) {
            await this.auditService.logAudit('TOGGLE_FEATURE', `Feature flag ${request.name} set to ${request.enabled}`, 'FAILED');
            console.error('Error toggling feature:', error);
            throw error;
        }
    }


}

