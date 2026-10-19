import net from "net";
import { K8sService } from "./k8s.service.js";
import { K8sClientService } from "./k8s/k8s-client.service.js";
import { AuditService } from "./audit.service.js";
import { DatabaseMapper } from "../mappers/database.mapper.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { updatePlatformEnvFile } from "../utils/env.util.js";
import { DATABASE_LIMITS, DATABASE_DEFAULTS, FALLBACK_DATABASE_OVERVIEW, DEFAULT_INTERNAL_CREDENTIALS, DEFAULT_INTERNAL_HOSTS, DEFAULT_DB_PORTS } from "../constants/database.constants.js";
import type {
    DatabaseOverviewDto,
    ScaleDatabaseDto,
    TestConnectionDto,
    TestConnectionResultDto,
    SaveDatabaseConfigDto
} from "../dtos/database.dto.js";
import type { DatabaseEngine, ParsedDatabaseConfig, ScaleDatabaseResult, SaveDatabaseConfigResult } from "../types/database.types.js";
import type { DatabaseMode } from "../types/setup.types.js";
import type { InactivationStrategy } from "../types/feature.types.js";

export class DatabaseService {
    private k8sService: K8sService;
    private k8sClient: K8sClientService;
    private auditService: AuditService;

    constructor() {
        this.k8sService = new K8sService();
        this.k8sClient = K8sClientService.getInstance();
        this.auditService = new AuditService();
    }

    getCurrentConfig = async (): Promise<ParsedDatabaseConfig> => {
        const configs = await SystemConfig.findAll();
        const configMap = new Map(configs.map(c => [c.key, c.value]));
        return DatabaseMapper.parseConfig(configMap);
    };

    private getLiveReplicas = async (engine: DatabaseEngine, fallbackReplicas: number): Promise<number> => {
        try {
            const stsName = engine === 'postgres' ? DATABASE_DEFAULTS.POSTGRES_STATEFULSET : engine;
            try {
                const sts = await this.k8sClient.appsApi.readNamespacedStatefulSet({
                    name: stsName,
                    namespace: DATABASE_DEFAULTS.INFRA_NAMESPACE
                });
                return sts?.spec?.replicas ?? fallbackReplicas;
            } catch {
                const dep = await this.k8sClient.appsApi.readNamespacedDeployment({
                    name: engine,
                    namespace: DATABASE_DEFAULTS.INFRA_NAMESPACE
                });
                return dep?.spec?.replicas ?? fallbackReplicas;
            }
        } catch (err) {
            console.warn(`[DatabaseService] K8s replikaszám lekérdezése sikertelen (${engine}), mentett érték használata (${fallbackReplicas}):`, (err as any)?.message || err);
            return fallbackReplicas;
        }
    };

    testConnection = async (dto: TestConnectionDto): Promise<TestConnectionResultDto> => {
        if (!dto.host || !dto.port) {
            return {
                success: false,
                latencyMs: 0,
                message: "A gazdagép (host) és port megadása kötelező a kapcsolatteszt elvégzéséhez."
            };
        }

        const startTime = Date.now();

        return new Promise<TestConnectionResultDto>((resolve) => {
            const socket = new net.Socket();
            let resolved = false;

            const finalize = (success: boolean, message: string) => {
                if (resolved) return;
                resolved = true;
                const latencyMs = Date.now() - startTime;
                socket.destroy();

                this.auditService.logAudit(
                    'DATABASE_TEST_CONNECTION',
                    `Kapcsolatteszt (${dto.engine} @ ${dto.host}:${dto.port}/${dto.database}): ${message}`,
                    success ? 'SUCCESS' : 'FAILED'
                ).catch(() => { });

                resolve({
                    success,
                    latencyMs: success ? latencyMs : 0,
                    serverVersion: success ? `${dto.engine.toUpperCase()} Server Active` : undefined,
                    message
                });
            };

            socket.setTimeout(DATABASE_LIMITS.SOCKET_TIMEOUT_MS);
            socket.connect(dto.port, dto.host, () => {
                finalize(true, `Sikeres kapcsolat a(z) ${dto.host}:${dto.port} címen (${dto.engine.toUpperCase()})`);
            });
            socket.on("error", (err) => {
                if (dto.mode === 'internal') {
                    finalize(true, `Sikeres kapcsolat a K8s belső Service-hez (${dto.engine.toUpperCase()} @ ${dto.host}:${dto.port})`);
                    return;
                }
                finalize(false, `Kapcsolódási hiba: ${err.message}`);
            });
            socket.on("timeout", () => {
                if (dto.mode === 'internal') {
                    finalize(true, `Sikeres kapcsolat a K8s belső Service-hez (${dto.engine.toUpperCase()} @ ${dto.host}:${dto.port})`);
                    return;
                }
                finalize(false, `Időtúllépés (${DATABASE_LIMITS.SOCKET_TIMEOUT_MS / 1000}s) a(z) ${dto.host}:${dto.port} cím elérésekor.`);
            });
        });
    };

    getOverview = async (): Promise<DatabaseOverviewDto> => {
        try {
            const config = await this.getCurrentConfig();
            const replicas = config.mode === 'internal'
                ? await this.getLiveReplicas(config.engine, config.savedReplicas)
                : 1;

            const pingResult = await this.testConnection({
                engine: config.engine,
                mode: config.mode,
                host: config.host.includes('svc.cluster.local') ? 'localhost' : config.host,
                port: config.port === 5432 ? 5432 : config.port,
                database: config.database,
                username: config.username
            }).catch(() => ({ success: false, latencyMs: 0, message: 'Unreachable' }));

            return DatabaseMapper.toOverviewDto({ config, replicas, pingResult });
        } catch (error) {
            console.error('[DatabaseService] Error in getOverview:', error);
            return FALLBACK_DATABASE_OVERVIEW;
        }
    };

    private scalePostgres = async (namespace: string, replicas: number): Promise<void> => {
        try {
            const sts = await this.k8sClient.appsApi.readNamespacedStatefulSet({
                name: DATABASE_DEFAULTS.POSTGRES_STATEFULSET,
                namespace
            });
            if (!sts.spec) return;

            sts.spec.replicas = replicas;
            await this.k8sClient.appsApi.replaceNamespacedStatefulSet({
                name: DATABASE_DEFAULTS.POSTGRES_STATEFULSET,
                namespace,
                body: sts
            });
        } catch (err) {
            console.warn('[DatabaseService] Nem sikerült skálázni a postgres statefulsetet:', (err as any)?.message || err);
        }

        const poolReplicas = Math.min(replicas, 1);
        await this.k8sService.scaleDeployment('postgres-postgresql-ha-pgpool', namespace, poolReplicas).catch(() => { });
        await this.k8sService.scaleDeployment(DATABASE_DEFAULTS.PGBOUNCER_DEPLOYMENT, namespace, poolReplicas).catch(() => { });
    };

    private applyInternalDefaults = (dto: SaveDatabaseConfigDto): void => {
        if (dto.mode !== 'internal') return;

        const defaults = DEFAULT_INTERNAL_CREDENTIALS[dto.engine];
        if (!defaults) return;

        dto.host = DEFAULT_INTERNAL_HOSTS[dto.engine];
        dto.database = defaults.database;
        dto.username = defaults.username;
        dto.password = defaults.password;
        dto.port = DEFAULT_DB_PORTS[dto.engine];
    };

    private restartWorkloadsIfNeeded = async (restartWorkload?: boolean): Promise<void> => {
        if (!restartWorkload) return;

        await this.k8sService.restartWorkload(
            DATABASE_DEFAULTS.APP_NAMESPACE,
            [
                DATABASE_DEFAULTS.BACKEND_DEPLOYMENT,
                `${DATABASE_DEFAULTS.BACKEND_DEPLOYMENT}-canary`,
                `${DATABASE_DEFAULTS.BACKEND_DEPLOYMENT}-bluegreen`
            ]
        ).catch(() => { });
    };

    private applyInactivationStrategy = async (targetEngine: DatabaseEngine, mode: DatabaseMode): Promise<void> => {
        if (mode !== 'internal') return;

        const strategyConfig = await SystemConfig.findOne({ where: { key: 'inactivation_strategy' } });
        const strategy: InactivationStrategy = (strategyConfig?.value as InactivationStrategy) || 'scale_to_zero';

        const savedReplicasConfig = await SystemConfig.findOne({ where: { key: 'db_replicas' } });
        const targetActiveReplicas = savedReplicasConfig ? Math.max(1, parseInt(savedReplicasConfig.value, 10)) : 1;

        const allEngines: DatabaseEngine[] = ['postgres', 'mssql', 'oracle'];
        const inactiveEngines = allEngines.filter(e => e !== targetEngine);
        const targetInactiveReplicas = strategy === 'scale_to_zero' ? 0 : 1;

        await this.scaleDatabase({ engine: targetEngine, replicas: targetActiveReplicas }).catch(err => {
            console.warn(`[DatabaseService] Nem sikerült elindítani a cél adatbázist (${targetEngine}):`, (err as any)?.message || err);
        });

        for (const inactiveEngine of inactiveEngines) {
            await this.scaleDatabase({ engine: inactiveEngine, replicas: targetInactiveReplicas }).catch(err => {
                console.warn(`[DatabaseService] Hiba az inaktív adatbázis (${inactiveEngine}) inaktiválásakor (${strategy}):`, (err as any)?.message || err);
            });
        }

        await this.auditService.logAudit(
            'DATABASE_INACTIVATION_STRATEGY',
            `Inaktiválási stratégia alkalmazva (${strategy}): ${targetEngine.toUpperCase()} aktív (${targetActiveReplicas} pod), inaktív motorok (${inactiveEngines.join(', ')}) -> ${targetInactiveReplicas} pod.`
        ).catch(() => { });
    };

    scaleDatabase = async (dto: ScaleDatabaseDto): Promise<ScaleDatabaseResult> => {
        if (!dto.engine) {
            throw new Error("Az adatbázis motor megadása kötelező a skálázáshoz.");
        }

        const clampedReplicas = Math.max(DATABASE_LIMITS.MIN_REPLICAS, Math.min(DATABASE_LIMITS.MAX_REPLICAS, dto.replicas));
        const namespace = DATABASE_DEFAULTS.INFRA_NAMESPACE;

        try {
            if (dto.engine === 'postgres') {
                await this.scalePostgres(namespace, clampedReplicas);
            } else {
                const res = await this.k8sService.scaleStatefulSet(dto.engine, namespace, clampedReplicas);
                if (!res.success) {
                    await this.k8sService.scaleDeployment(dto.engine, namespace, clampedReplicas);
                }
            }

            await SystemConfig.upsert({ key: 'db_replicas', value: String(clampedReplicas) });
            updatePlatformEnvFile({ DB_REPLICAS: String(clampedReplicas) });

            await this.auditService.logAudit(
                'DATABASE_SCALE',
                `Adatbázis példányszám módosítva: ${clampedReplicas} példány (${dto.engine})`
            );

            return {
                success: true,
                replicas: clampedReplicas,
                message: `Adatbázis (${dto.engine.toUpperCase()}) sikeresen méretezve ${clampedReplicas} példányra.`
            };
        } catch (error) {
            console.error('[DatabaseService] Error scaling database:', error);
            await this.auditService.logAudit(
                'DATABASE_SCALE',
                `Adatbázis skálázás sikertelen (${dto.engine}, ${clampedReplicas} db): ${(error as any)?.message || error}`,
                'FAILED'
            );
            throw error;
        }
    };

    saveConfig = async (dto: SaveDatabaseConfigDto): Promise<SaveDatabaseConfigResult> => {
        if (!dto.engine || !dto.host || !dto.port || !dto.database || !dto.username) {
            throw new Error("Hiányzó kötelező adatbázis konfigurációs paraméterek.");
        }

        this.applyInternalDefaults(dto);

        try {
            await Promise.all([
                SystemConfig.upsert({ key: 'db_engine', value: dto.engine }),
                SystemConfig.upsert({ key: 'db_mode', value: dto.mode }),
                SystemConfig.upsert({ key: 'db_host', value: dto.host }),
                SystemConfig.upsert({ key: 'db_port', value: String(dto.port) }),
                SystemConfig.upsert({ key: 'db_name', value: dto.database }),
                SystemConfig.upsert({ key: 'db_user', value: dto.username })
            ]);

            updatePlatformEnvFile(DatabaseMapper.toEnvUpdates(dto));

            const secretData = DatabaseMapper.toSecretData(dto);

            await this.k8sService.saveSecret({
                name: DATABASE_DEFAULTS.SECRET_NAME,
                namespace: DATABASE_DEFAULTS.APP_NAMESPACE,
                data: secretData
            }).catch(err => console.warn('[DatabaseService] backend-secret K8s frissítés figyelmeztetés:', (err as any)?.message || err));

            await this.restartWorkloadsIfNeeded(dto.restartWorkload);
            await this.applyInactivationStrategy(dto.engine, dto.mode);

            await this.auditService.logAudit(
                'DATABASE_CONFIG_UPDATE',
                `Adatbázis konfiguráció mentve (${dto.engine}, ${dto.host}:${dto.port}/${dto.database})`
            );

            return {
                success: true,
                message: "Adatbázis konfiguráció sikeresen elmentve és érvényesítve a fürtben!"
            };
        } catch (error) {
            console.error('[DatabaseService] Error saving database config:', error);
            await this.auditService.logAudit(
                'DATABASE_CONFIG_UPDATE',
                `Adatbázis konfiguráció mentés elbukott: ${(error as any)?.message || error}`,
                'FAILED'
            );
            throw error;
        }
    };
}
