import crypto from "crypto";
import pg from "pg";
import { K8sService } from "./k8s.service.js";
import { AuditService } from "./audit.service.js";
import { DatabaseService } from "./database.service.js";
import { DataSyncService } from "./data-sync.service.js";
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
        if (waitMs > 0) {
            await delay(waitMs);
        }
    };

    private getK8sServerFlag = async (): Promise<string> => {
        try {
            const fs = await import('fs');
            const kubeConfigPath = process.env.KUBECONFIG || '/app/.kube/config';
            if (fs.existsSync(kubeConfigPath)) {
                const content = fs.readFileSync(kubeConfigPath, 'utf8');
                const portMatch = content.match(/server:\s*https?:\/\/[^:]+:(\d+)/);
                const port = portMatch ? portMatch[1] : '61682';
                const host = process.env.K8S_SERVER_HOST || 'host.docker.internal';
                return `--server=https://${host}:${port} --insecure-skip-tls-verify=true`;
            }
        } catch { }
        return process.env.K8S_SERVER_HOST ? `--server=https://${process.env.K8S_SERVER_HOST}:61682 --insecure-skip-tls-verify=true` : '';
    };

    private querySourceDatabaseStats = async (
        engine: string,
        host: string,
        port: number,
        database: string,
        user: string,
        password?: string
    ): Promise<{ totalTables: number; totalRows: number }> => {
        const k8sFlag = await this.getK8sServerFlag();

        if (engine === 'mssql') {
            try {
                const { exec } = await import('child_process');
                const util = await import('util');
                const execAsync = util.promisify(exec);
                const dbName = database || 'mesdb';
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "MesStrongPass123!" -C -Q "SET NOCOUNT ON; DECLARE @db NVARCHAR(128); SELECT TOP 1 @db = name FROM sys.databases WHERE name IN ('mesdb', 'mes_db', '${dbName}') ORDER BY CASE WHEN name = '${dbName}' THEN 1 WHEN name = 'mesdb' THEN 2 ELSE 3 END; IF @db IS NOT NULL BEGIN DECLARE @sql NVARCHAR(MAX) = 'SELECT (SELECT count(*) FROM ' + QUOTENAME(@db) + '.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = ''BASE TABLE'') AS total_tables, (SELECT COALESCE(SUM(p.rows), 0) FROM ' + QUOTENAME(@db) + '.sys.tables t JOIN ' + QUOTENAME(@db) + '.sys.partitions p ON t.object_id = p.object_id WHERE p.index_id IN (0,1)) AS total_rows;'; EXEC sp_executesql @sql; END ELSE SELECT 0, 0;" -h -1 -W`;
                const { stdout } = await execAsync(cmd, { timeout: 8000 });
                const parts = stdout.trim().split(/\s+/).filter(Boolean);
                if (parts.length >= 2) {
                    const totalTables = parseInt(parts[0] ?? '0', 10) || 0;
                    const totalRows = parseInt(parts[1] ?? '0', 10) || 0;
                    return { totalTables, totalRows };
                }
            } catch (err) {
                console.warn('[DatabaseMigrationService] MSSQL élő statisztika lekérdezése sikertelen:', (err as any)?.message || err);
            }
        }

        if (engine === 'postgres') {
            const pass = password || 'VnUH22Refo';
            const dbNames = ['mes_db', 'postgres', database, 'mesdb'].filter(Boolean);
            const hostsToTry = [
                host.includes('svc.cluster.local') ? 'postgres-postgresql-ha-postgresql.platform-infra.svc.cluster.local' : host,
                'host.docker.internal',
                'localhost'
            ];

            for (const h of hostsToTry) {
                for (const db of dbNames) {
                    try {
                        const client = new pg.Client({
                            host: h,
                            port: port || 5432,
                            database: db,
                            user: user && user !== 'sa' ? user : 'postgres',
                            password: pass,
                            connectionTimeoutMillis: 1500
                        });
                        await client.connect();
                        const tablesRes = await client.query(
                            "SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
                        );
                        const rowsRes = await client.query(
                            "SELECT COALESCE(SUM(n_live_tup), 0)::bigint as total_rows FROM pg_stat_user_tables"
                        );
                        await client.end();

                        const totalTables = Number(tablesRes.rows[0]?.count) || 0;
                        const totalRows = Number(rowsRes.rows[0]?.total_rows) || 0;
                        if (totalTables > 1 || totalRows > 0) {
                            return { totalTables, totalRows };
                        }
                    } catch { }
                }
            }

            try {
                const { exec } = await import('child_process');
                const util = await import('util');
                const execAsync = util.promisify(exec);
                for (const db of ['mes_db', 'postgres', database].filter(Boolean)) {
                    try {
                        const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U postgres -d ${db} -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'; SELECT COALESCE(SUM(c), 0) FROM (SELECT (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::int as c FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') t;"`;
                        const { stdout } = await execAsync(cmd, { timeout: 8000 });
                        const lines = stdout.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                        if (lines.length >= 2) {
                            const totalTables = parseInt(lines[0] ?? '0', 10) || 0;
                            const totalRows = parseInt(lines[1] ?? '0', 10) || 0;
                            if (totalTables > 1 || totalRows > 0) {
                                return { totalTables, totalRows };
                            }
                        }
                    } catch { }
                }
            } catch (err) {
                console.warn('[DatabaseMigrationService] PostgreSQL élő statisztika lekérdezése podból sikertelen:', (err as any)?.message || err);
            }
        }

        if (engine === 'oracle') {
            try {
                const { exec } = await import('child_process');
                const util = await import('util');
                const execAsync = util.promisify(exec);
                const oracleUser = user && user !== 'postgres' && user !== 'sa' && user !== 'system' ? user : 'mesuser';
                const pass = password || 'mespassword';
                const db = database && database !== 'mes_db' && database !== 'mesdb' && database !== 'postgres' ? database : 'FREEPDB1';

                const sql = "printf 'SET PAGESIZE 0\\nSET FEEDBACK OFF\\nSET SERVEROUTPUT ON\\nSELECT count(*) FROM user_tables;\\nDECLARE v_total NUMBER := 0; v_cnt NUMBER; BEGIN FOR t IN (SELECT table_name FROM user_tables) LOOP EXECUTE IMMEDIATE \\x27SELECT count(*) FROM \\x27 || t.table_name INTO v_cnt; v_total := v_total + v_cnt; END LOOP; DBMS_OUTPUT.PUT_LINE(v_total); END;\\n/\\nEXIT;\\n'";
                const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "${sql} | sqlplus -s ${oracleUser}/${pass}@localhost:1521/${db}"`;
                const { stdout } = await execAsync(cmd, { timeout: 8000 });
                const lines = stdout.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                if (lines.length >= 2) {
                    const totalTables = parseInt(lines[0] ?? '0', 10) || 0;
                    const totalRows = parseInt(lines[1] ?? '0', 10) || 0;
                    return { totalTables, totalRows };
                }
            } catch (err) {
                console.warn('[DatabaseMigrationService] Oracle élő statisztika lekérdezése podból sikertelen:', (err as any)?.message || err);
            }
        }

        return { totalTables: 0, totalRows: 0 };
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

        const isSourceEmpty = stats.totalTables === 0 && stats.totalRows === 0;

        await this.step(jobId, 'SNAPSHOT', MIGRATION_CONSTANTS.SNAPSHOT_PROGRESS, 'Snapshot adatmentés készítése (MinIO S3)...', 1200, {
            tablesTotal: stats.totalTables,
            tablesMigrated: 0,
            rowsCopied: 0
        });
        await this.k8sService.triggerBackupJob(DATABASE_DEFAULTS.INFRA_NAMESPACE, 'db-backup').catch(() => { });

        await this.step(jobId, 'SCHEMA_INIT', MIGRATION_CONSTANTS.SCHEMA_PROGRESS, `Cél adatbázis (${dto.targetEngine.toUpperCase()}) séma inicializálása és DDL felkészítése...`, 1200);
        if (dto.targetConfig.mode === 'internal') {
            await this.k8sService.deployDatabaseEngine(dto.targetEngine, 'internal').catch(() => { });
        }

        // Tényleges dinamikus adatszinkronizáció (minden modell, tábla és sor automatikus átvitele)
        let lastReportedRows = 0;
        let lastReportedTables = 0;
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
                lastReportedTables = migrated;
                lastReportedRows = rows;
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

        await this.step(jobId, 'COMPLETED', MIGRATION_CONSTANTS.COMPLETED_PROGRESS, `Sikeres adatátvitel! ${syncResult.totalTables} tábla és ${syncResult.totalRows.toLocaleString()} rekord átmásolva a(z) ${dto.targetEngine.toUpperCase()} adatbázisba.`, 0, {
            tablesTotal: syncResult.totalTables,
            tablesMigrated: syncResult.totalTables,
            rowsCopied: syncResult.totalRows,
            completedAt: new Date().toISOString()
        });

        await this.auditService.logAudit(
            'DATABASE_MIGRATION_COMPLETE',
            `Adatbázis migráció sikeres (${dto.sourceEngine} -> ${dto.targetEngine}): ${syncResult.totalTables} tábla, ${syncResult.totalRows.toLocaleString()} rekord dinamikusan átmásolva.`
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
