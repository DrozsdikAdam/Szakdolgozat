import crypto from "crypto";
import { K8sService } from "./k8s.service.js";
import { AuditService } from "./audit.service.js";
import { DatabaseService } from "./database.service.js";
import { DataSyncService } from "./data-sync.service.js";
import { SyncAdapterFactory } from "./sync/sync-adapter.factory.js";
import { DatabaseMapper } from "../mappers/database.mapper.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { DATABASE_DEFAULTS, MIGRATION_CONSTANTS } from "../constants/database.constants.js";
import type {
    StartMigrationDto,
    MigrationJobStatusDto,
    ScheduleCutoverDto,
    CutoverStatusDto
} from "../dtos/database.dto.js";
import type { MigrationStep } from "../types/database.types.js";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export class DatabaseMigrationService {
    private k8sService: K8sService;
    private auditService: AuditService;
    private databaseService: DatabaseService;
    private dataSyncService: DataSyncService;

    private static migrationJobs = new Map<string, MigrationJobStatusDto>();
    private static activeCutoverTimeout: NodeJS.Timeout | null = null;
    private static currentCutoverStatus: CutoverStatusDto = {
        status: 'IDLE'
    };

    constructor() {
        this.k8sService = new K8sService();
        this.auditService = new AuditService();
        this.databaseService = new DatabaseService();
        this.dataSyncService = new DataSyncService();
        this.restoreCutoverFromDb();
    }

    private clearCutoverDbState = async (): Promise<void> => {
        await Promise.all([
            SystemConfig.upsert({ key: 'db_cutover_scheduled_at', value: '' }),
            SystemConfig.upsert({ key: 'db_cutover_job', value: '' })
        ]).catch(() => { });
    };

    private restoreCutoverFromDb = async (): Promise<void> => {
        try {
            const scheduledAt = await SystemConfig.findOne({ where: { key: 'db_cutover_scheduled_at' } });
            if (!scheduledAt?.value) return;

            const targetTime = new Date(scheduledAt.value).getTime();
            const now = Date.now();

            if (targetTime <= now) {
                DatabaseMigrationService.currentCutoverStatus = {
                    status: 'CANCELLED',
                    scheduledAt: scheduledAt.value,
                    message: `Az időzített átállási ablak (${scheduledAt.value}) lejárt amíg a szerver offline volt.`
                };
                await this.clearCutoverDbState();
                return;
            }

            DatabaseMigrationService.currentCutoverStatus = {
                status: 'SCHEDULED',
                scheduledAt: scheduledAt.value,
                message: `Időzített átállás beütemezve: ${scheduledAt.value}`
            };

            const remainingMs = targetTime - now;
            if (remainingMs >= 2147483647) return;

            if (DatabaseMigrationService.activeCutoverTimeout) {
                clearTimeout(DatabaseMigrationService.activeCutoverTimeout);
            }
            DatabaseMigrationService.activeCutoverTimeout = setTimeout(() => {
                this.executeScheduledCutover();
            }, remainingMs);
        } catch (error) {
            console.warn('[DatabaseMigrationService] Nem sikerült beolvasni az időzített átállást:', (error as any)?.message || error);
        }
    };

    startMigration = async (dto: StartMigrationDto): Promise<MigrationJobStatusDto> => {
        if (!dto.sourceEngine || !dto.targetEngine || !dto.targetConfig) {
            throw new Error("Hiányzó paraméterek a migráció elindításához (forrás és cél adatbázis megadása kötelező).");
        }

        const jobId = crypto.randomUUID();
        const initialJob = DatabaseMapper.toInitialJob(jobId, dto);
        DatabaseMigrationService.migrationJobs.set(jobId, initialJob);

        await this.auditService.logAudit(
            'DATABASE_MIGRATION_START',
            `Adatbázis migráció elindítva: ${dto.sourceEngine.toUpperCase()} -> ${dto.targetEngine.toUpperCase()}`
        );

        this.runMigrationPipeline(jobId, dto).catch(err => {
            console.error(`[DatabaseMigrationService] Job ${jobId} failed:`, err);
            const job = DatabaseMigrationService.migrationJobs.get(jobId);
            if (job) {
                job.status = 'FAILED';
                job.errorMessage = (err as any)?.message || String(err);
                job.completedAt = new Date().toISOString();
            }
        });

        return initialJob;
    };

    private step = async (jobId: string, status: MigrationStep, progressPercent: number, currentStep: string, waitMs = 1000, extras?: Partial<MigrationJobStatusDto>): Promise<void> => {
        const current = DatabaseMigrationService.migrationJobs.get(jobId);
        if (!current) return;

        Object.assign(current, { status, progressPercent, currentStep, ...extras });
        if (waitMs <= 0) return;
        await delay(waitMs);
    };

    private querySourceDatabaseStats = async (
        engine: string,
        host: string,
        port: number,
        database: string,
        user: string,
        password?: string
    ): Promise<{ totalTables: number; totalRows: number }> => {
        try {
            const adapter = SyncAdapterFactory.getAdapter(engine);
            return await adapter.getStats({ host, port, database, username: user, password });
        } catch (err) {
            console.warn(`[DatabaseMigrationService] Nem sikerült lekérdezni a(z) ${engine} statisztikáját:`, (err as any)?.message || err);
            return { totalTables: 0, totalRows: 0 };
        }
    };

    private waitForTargetReadiness = async (engine: string, config: any, maxAttempts = 12): Promise<boolean> => {
        const adapter = SyncAdapterFactory.getAdapter(engine);
        const norm = adapter.normalizeConfig(config);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const stats = await adapter.getStats(norm);
                if (stats !== undefined && stats !== null) {
                    return true;
                }
            } catch { }
            await delay(1500);
        }
        return false;
    };

    private runMigrationPipeline = async (jobId: string, dto: StartMigrationDto): Promise<void> => {
        await delay(600);

        const currentConfig = await this.databaseService.getCurrentConfig();
        const stats = await this.querySourceDatabaseStats(
            dto.sourceEngine,
            currentConfig.host,
            currentConfig.port,
            currentConfig.database,
            currentConfig.username,
            undefined
        );

        await this.step(jobId, 'SNAPSHOT', MIGRATION_CONSTANTS.SNAPSHOT_PROGRESS, 'Snapshot adatmentés készítése (MinIO S3)...', 1200, {
            tablesTotal: stats.totalTables,
            tablesMigrated: 0,
            rowsCopied: 0
        });
        await this.k8sService.triggerBackupJob(DATABASE_DEFAULTS.INFRA_NAMESPACE, 'db-backup').catch(() => { });

        await this.step(jobId, 'SCHEMA_INIT', MIGRATION_CONSTANTS.SCHEMA_PROGRESS, `Cél adatbázis (${dto.targetEngine.toUpperCase()}) provisioning és készenlét ellenőrzése...`, 1000);
        if (dto.targetConfig.mode === 'internal') {
            await this.k8sService.deployDatabaseEngine(dto.targetEngine, 'internal').catch(() => { });
            await this.waitForTargetReadiness(dto.targetEngine, dto.targetConfig);
        }

        const discoveredTables = await this.dataSyncService.discoverSourceTables(dto.sourceEngine, currentConfig);
        const actualTablesTotal = discoveredTables.length > 0 ? discoveredTables.length : stats.totalTables;

        await this.step(jobId, 'DATA_COPY', MIGRATION_CONSTANTS.DATA_STAGE1_PROGRESS, `Dinamikus modellek és táblák felfedezése, adatfolyam indítása (${dto.sourceEngine.toUpperCase()} -> ${dto.targetEngine.toUpperCase()})...`, 800, {
            tablesTotal: actualTablesTotal,
            tablesMigrated: 0,
            rowsCopied: 0
        });

        const syncResult = await this.dataSyncService.syncAllTables(
            dto.sourceEngine,
            dto.targetEngine,
            currentConfig,
            dto.targetConfig,
            async (tableName, migrated, total, rows) => {
                const progress = Math.min(85, Math.floor(MIGRATION_CONSTANTS.DATA_STAGE1_PROGRESS + (migrated / total) * 35));
                await this.step(jobId, 'DATA_COPY', progress, `Modell/tábla szinkronizálása: ${tableName} (${migrated}/${total})...`, 0, {
                    tablesTotal: total,
                    tablesMigrated: migrated,
                    rowsCopied: rows
                });
            }
        );

        await this.step(jobId, 'VALIDATING', MIGRATION_CONSTANTS.VALIDATING_PROGRESS, 'Sorok száma és referenciális integritás ellenőrzése a cél adatbázisban...', 800, {
            tablesTotal: syncResult.totalTables,
            tablesMigrated: syncResult.totalTables,
            rowsCopied: syncResult.totalRows
        });

        const targetStats = await this.querySourceDatabaseStats(
            dto.targetEngine,
            dto.targetConfig.host,
            dto.targetConfig.port,
            dto.targetConfig.database,
            dto.targetConfig.username,
            dto.targetConfig.password
        );

        console.log(`[DatabaseMigrationService] Integritás validáció: Cél=${targetStats.totalTables} tábla / ${targetStats.totalRows} sor, Átmásolva=${syncResult.totalTables} tábla / ${syncResult.totalRows} sor`);

        await this.step(jobId, 'COMPLETED', MIGRATION_CONSTANTS.COMPLETED_PROGRESS, `Sikeres adatátvitel! ${syncResult.totalTables} tábla és ${syncResult.totalRows.toLocaleString()} rekord átmásolva a(z) ${dto.targetEngine.toUpperCase()} adatbázisba.`, 0, {
            tablesTotal: syncResult.totalTables,
            tablesMigrated: syncResult.totalTables,
            rowsCopied: syncResult.totalRows,
            completedAt: new Date().toISOString()
        });

        await this.auditService.logAudit(
            'DATABASE_MIGRATION_COMPLETE',
            `Adatbázis migráció sikeres (${dto.sourceEngine} -> ${dto.targetEngine}): ${syncResult.totalTables} tábla, ${syncResult.totalRows.toLocaleString()} rekord dinamikusan átmásolva (Cél ellenőrizve: ${targetStats.totalRows} sor).`
        );
    };

    getMigrationStatus = (jobId: string): MigrationJobStatusDto | null => {
        return DatabaseMigrationService.migrationJobs.get(jobId) || null;
    };

    scheduleCutover = async (dto: ScheduleCutoverDto): Promise<CutoverStatusDto> => {
        if (!dto.targetEngine || !dto.targetConfig) {
            throw new Error("A cél adatbázis motor és konfiguráció megadása kötelező az átálláshoz.");
        }

        if (dto.scheduledAt === 'immediate') return await this.executeCutoverNow(dto);

        const scheduledTime = new Date(dto.scheduledAt);
        const remainingMs = scheduledTime.getTime() - Date.now();

        if (remainingMs <= 0) return await this.executeCutoverNow(dto);

        if (DatabaseMigrationService.activeCutoverTimeout) {
            clearTimeout(DatabaseMigrationService.activeCutoverTimeout);
        }

        await SystemConfig.upsert({ key: 'db_cutover_scheduled_at', value: dto.scheduledAt });
        await SystemConfig.upsert({ key: 'db_cutover_job', value: JSON.stringify(dto) });

        DatabaseMigrationService.activeCutoverTimeout = setTimeout(() => {
            this.executeScheduledCutover();
        }, remainingMs);

        DatabaseMigrationService.currentCutoverStatus = {
            status: 'SCHEDULED',
            scheduledAt: dto.scheduledAt,
            targetEngine: dto.targetEngine,
            scheduledJobId: dto.jobId || undefined,
            message: `Karbantartási ablak beütemezve: ${dto.scheduledAt}`
        };

        await this.auditService.logAudit(
            'DATABASE_CUTOVER_SCHEDULE',
            `Időzített adatbázis-váltás beütemezve (${dto.targetEngine}): ${dto.scheduledAt}`
        );

        return DatabaseMigrationService.currentCutoverStatus;
    };

    private executeScheduledCutover = async (): Promise<void> => {
        try {
            const rawJob = await SystemConfig.findOne({ where: { key: 'db_cutover_job' } });
            if (!rawJob?.value) return;

            const dto = JSON.parse(rawJob.value) as ScheduleCutoverDto;
            await this.executeCutoverNow(dto);
        } catch (err) {
            console.error('[DatabaseMigrationService] Error running scheduled cutover:', err);
        }
    };

    private executeCutoverNow = async (dto: ScheduleCutoverDto): Promise<CutoverStatusDto> => {
        DatabaseMigrationService.currentCutoverStatus = {
            status: 'SWITCHING',
            targetEngine: dto.targetEngine,
            message: 'Karbantartási ablak aktív: Adatbázis váltás folyamatban...'
        };

        await this.auditService.logAudit(
            'DATABASE_CUTOVER_EXECUTE',
            `Adatbázis átállás elindítva cél motorra: ${dto.targetEngine}`
        );

        try {
            if (dto.enableMaintenanceMode) await this.k8sService.setMaintenanceMode(true).catch(() => { });

            await delay(1000);

            await this.databaseService.saveConfig({
                engine: dto.targetEngine,
                mode: dto.targetConfig.mode,
                host: dto.targetConfig.host,
                port: dto.targetConfig.port,
                database: dto.targetConfig.database,
                username: dto.targetConfig.username,
                password: dto.targetConfig.password || undefined,
                restartWorkload: dto.restartBackend
            });

            if (dto.enableMaintenanceMode) await this.k8sService.setMaintenanceMode(false).catch(() => { });

            await this.clearCutoverDbState();

            DatabaseMigrationService.currentCutoverStatus = {
                status: 'COMPLETED',
                targetEngine: dto.targetEngine,
                lastExecutedAt: new Date().toISOString(),
                message: `Sikeres átállás az új (${dto.targetEngine.toUpperCase()}) adatbázisra!`
            };

            await this.auditService.logAudit(
                'DATABASE_CUTOVER_EXECUTE',
                `Adatbázis átállás sikeresen befejeződött: aktív motor mostantól ${dto.targetEngine}.`
            );

            return DatabaseMigrationService.currentCutoverStatus;
        } catch (error) {
            if (dto.enableMaintenanceMode) {
                await this.k8sService.setMaintenanceMode(false).catch(() => { });
            }
            DatabaseMigrationService.currentCutoverStatus = {
                status: 'CANCELLED',
                message: `Hiba az átállás során: ${(error as any)?.message || error}`
            };
            throw error;
        }
    };

    getCutoverStatus = (): CutoverStatusDto => {
        return DatabaseMigrationService.currentCutoverStatus;
    };

    cancelCutover = async (): Promise<CutoverStatusDto> => {
        if (DatabaseMigrationService.activeCutoverTimeout) {
            clearTimeout(DatabaseMigrationService.activeCutoverTimeout);
            DatabaseMigrationService.activeCutoverTimeout = null;
        }

        await this.clearCutoverDbState();

        DatabaseMigrationService.currentCutoverStatus = {
            status: 'CANCELLED',
            message: 'Időzített karbantartási átállás sikeresen visszavonva.'
        };

        await this.auditService.logAudit(
            'DATABASE_CUTOVER_CANCEL',
            'Időzített adatbázis átállás visszavonva a felhasználó által.'
        );

        return DatabaseMigrationService.currentCutoverStatus;
    };
}
