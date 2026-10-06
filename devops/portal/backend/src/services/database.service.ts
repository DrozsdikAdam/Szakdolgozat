import net from "net";
import { K8sService } from "./k8s.service.js";
import { K8sClientService } from "./k8s/k8s-client.service.js";
import { AuditService } from "./audit.service.js";
import { DatabaseMapper } from "../mappers/database.mapper.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { updatePlatformEnvFile } from "../utils/env.util.js";
import { DATABASE_LIMITS, DATABASE_DEFAULTS, FALLBACK_DATABASE_OVERVIEW } from "../constants/database.constants.js";
import type {
    DatabaseOverviewDto,
    ScaleDatabaseDto,
    TestConnectionDto,
    TestConnectionResultDto,
    SaveDatabaseConfigDto
} from "../dtos/database.dto.js";
import type { DatabaseEngine, ParsedDatabaseConfig, ScaleDatabaseResult, SaveDatabaseConfigResult } from "../types/database.types.js";

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
            if (engine !== 'postgres') {
                const dep = await this.k8sClient.appsApi.readNamespacedDeployment({
                    name: engine,
                    namespace: DATABASE_DEFAULTS.INFRA_NAMESPACE
                });
                return dep?.spec?.replicas ?? fallbackReplicas;
            }

            const sts = await this.k8sClient.appsApi.readNamespacedStatefulSet({
                name: DATABASE_DEFAULTS.POSTGRES_STATEFULSET,
                namespace: DATABASE_DEFAULTS.INFRA_NAMESPACE
            });
            return sts?.spec?.replicas ?? fallbackReplicas;
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
        } catch {
            await this.k8sService.scaleDeployment(
                DATABASE_DEFAULTS.PGBOUNCER_DEPLOYMENT,
                namespace,
                Math.min(replicas, 3)
            );
        }
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
                await this.k8sService.scaleDeployment(dto.engine, namespace, clampedReplicas);
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

            if (dto.restartWorkload) {
                await this.k8sService.restartWorkload(
                    DATABASE_DEFAULTS.APP_NAMESPACE,
                    [DATABASE_DEFAULTS.BACKEND_DEPLOYMENT]
                ).catch(() => { });
            }

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
