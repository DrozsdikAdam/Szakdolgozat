import * as net from "net";
import { K8sClientService } from "./k8s/k8s-client.service.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { AuditService } from "./audit.service.js";
import {
    STORAGE_DEFAULTS,
    STORAGE_LIMITS,
    STORAGE_CONFIG_KEYS
} from "../constants/storage.constants.js";
import { StorageMapper } from "../mappers/storage.mapper.js";
import type {
    StorageConfigUpdateDto,
    StorageOverViewDto,
    StorageOverViewStatus,
    StorageTestRequestDto,
    StorageTestResponseDto
} from "../types/storage.types.js";

export class StorageService {
    private k8sClient: K8sClientService;
    private auditService: AuditService;

    constructor() {
        this.k8sClient = K8sClientService.getInstance();
        this.auditService = new AuditService();
    }

    getOverview = async (): Promise<StorageOverViewDto> => {
        const configs = await SystemConfig.findAll();
        const configMap = new Map(configs.map(c => [c.key, c.value]));
        const config = StorageMapper.parseSavedConfig(configMap);

        const [stsInfo, allocatedSizeGb, serviceHealthy] = await Promise.all([
            this.fetchStatefulSetStatus(),
            this.fetchPvcSizeGb(config.savedInternalSizeGb),
            this.checkServiceHealth()
        ]);

        return StorageMapper.toOverviewDto({
            config,
            liveStatus: stsInfo.status,
            liveReplicas: stsInfo.replicas,
            allocatedSizeGb,
            serviceHealthy
        });
    };

    saveConfig = async (dto: StorageConfigUpdateDto): Promise<{ success: boolean; message: string }> => {
        if (dto.mode === "internal") return this.handleInternalConfig(dto);
        return this.handleExternalConfig(dto);
    };

    testConnection = async (dto: StorageTestRequestDto): Promise<StorageTestResponseDto> => {
        if (dto.mode === "internal") return this.testInternalMinio();
        return this.testExternalS3(dto);
    };

    private fetchStatefulSetStatus = async (): Promise<{ status: StorageOverViewStatus; replicas: number }> => {
        try {
            const sts = await this.k8sClient.appsApi.readNamespacedStatefulSet({
                name: STORAGE_DEFAULTS.STATEFULSET_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE
            });

            const replicas = sts.spec?.replicas ?? 0;
            const readyReplicas = sts.status?.readyReplicas ?? 0;
            const status = StorageMapper.resolveStatefulSetStatus(replicas, readyReplicas);

            return { status, replicas };
        } catch (err) {
            console.warn("[StorageService] Could not read StatefulSet app-storage:", (err as any)?.message || err);
            return { status: "Error", replicas: 0 };
        }
    };

    private fetchPvcSizeGb = async (fallbackSize: number): Promise<number> => {
        try {
            const pvc = await this.k8sClient.coreApi.readNamespacedPersistentVolumeClaim({
                name: STORAGE_DEFAULTS.PVC_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE
            });

            const storageReq = pvc.spec?.resources?.requests?.storage || pvc.status?.capacity?.storage;
            return StorageMapper.parseStorageSizeGb(storageReq, fallbackSize);
        } catch (err) {
            console.warn("[StorageService] Could not read PVC app-storage-pvc:", (err as any)?.message || err);
            return fallbackSize;
        }
    };

    private checkServiceHealth = async (): Promise<boolean> => {
        try {
            await this.k8sClient.coreApi.readNamespacedService({
                name: STORAGE_DEFAULTS.SERVICE_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE
            });
            return true;
        } catch {
            return false;
        }
    };

    private handleInternalConfig = async (dto: StorageConfigUpdateDto): Promise<{ success: boolean; message: string }> => {
        if (dto.internalSizeGb !== undefined) {
            const targetSize = Math.max(
                STORAGE_LIMITS.MIN_SIZE_GB,
                Math.min(dto.internalSizeGb, STORAGE_LIMITS.MAX_SIZE_GB)
            );

            const pvcResult = await this.updatePvcCapacity(targetSize);
            if (!pvcResult.success) {
                return { success: false, message: pvcResult.message! };
            }

            await SystemConfig.upsert({
                key: STORAGE_CONFIG_KEYS.INTERNAL_SIZE_GB,
                value: String(targetSize)
            });
        }

        await this.scaleStatefulSet(1);
        await SystemConfig.upsert({ key: STORAGE_CONFIG_KEYS.MODE, value: "internal" });

        const sizeInfo = dto.internalSizeGb !== undefined ? `méret=${dto.internalSizeGb}GB` : "méret változatlan";
        await this.auditService.logAudit(
            "STORAGE_CONFIG_UPDATE",
            `Belső MinIO tárhely beállítva (${sizeInfo})`,
            "SUCCESS"
        );

        return {
            success: true,
            message: "Belső tárhely beállítások sikeresen mentve."
        };
    };

    private handleExternalConfig = async (dto: StorageConfigUpdateDto): Promise<{ success: boolean; message: string }> => {
        await this.persistExternalConfig(dto);

        if (dto.scaleDownInternal !== undefined) {
            const targetReplicas = dto.scaleDownInternal ? 0 : 1;
            await this.scaleStatefulSet(targetReplicas);
        }

        await this.auditService.logAudit(
            "STORAGE_CONFIG_UPDATE",
            `Külső S3 tárhely beállítva: endpoint=${dto.externalEndpoint || "meglévő"}, bucket=${dto.externalBucket || "meglévő"}, scaleDownInternal=${dto.scaleDownInternal ?? false}`,
            "SUCCESS"
        );

        return {
            success: true,
            message: "Külső felhő S3 tárhely konfiguráció sikeresen mentve."
        };
    };

    private persistExternalConfig = async (dto: StorageConfigUpdateDto): Promise<void> => {
        const entries = StorageMapper.toExternalConfigEntries(dto);
        await Promise.all(entries.map(entry => SystemConfig.upsert(entry)));
    };

    private updatePvcCapacity = async (targetSize: number): Promise<{ success: boolean; message?: string }> => {
        try {
            const pvc = await this.k8sClient.coreApi.readNamespacedPersistentVolumeClaim({
                name: STORAGE_DEFAULTS.PVC_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE
            });

            const currentStorageStr = pvc.spec?.resources?.requests?.storage || pvc.status?.capacity?.storage;
            const currentSizeGb = StorageMapper.parseStorageSizeGb(currentStorageStr, STORAGE_LIMITS.DEFAULT_SIZE_GB);

            if (targetSize < currentSizeGb) {
                return {
                    success: false,
                    message: `A Kubernetes tároló (PVC) mérete csökkenteni nem lehetséges az adatvesztés elkerülése végett (jelenlegi: ${currentSizeGb} GB). Csak növelés támogatott 10 GB-ig.`
                };
            }

            if (targetSize === currentSizeGb) {
                return { success: true };
            }

            if (!pvc.spec?.resources?.requests) {
                return { success: true };
            }

            pvc.spec.resources.requests.storage = `${targetSize}Gi`;
            await this.k8sClient.coreApi.replaceNamespacedPersistentVolumeClaim({
                name: STORAGE_DEFAULTS.PVC_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE,
                body: pvc
            });

            return { success: true };
        } catch (err) {
            console.warn("[StorageService] Nem sikerült a PVC-t frissíteni:", (err as any)?.message || err);
            return { success: true };
        }
    };

    private scaleStatefulSet = async (targetReplicas: number): Promise<void> => {
        try {
            const sts = await this.k8sClient.appsApi.readNamespacedStatefulSet({
                name: STORAGE_DEFAULTS.STATEFULSET_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE
            });

            if (!sts.spec || sts.spec.replicas === targetReplicas) {
                return;
            }

            sts.spec.replicas = targetReplicas;
            await this.k8sClient.appsApi.replaceNamespacedStatefulSet({
                name: STORAGE_DEFAULTS.STATEFULSET_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE,
                body: sts
            });
        } catch (err) {
            console.warn("[StorageService] Nem sikerült a StatefulSet skálázása:", (err as any)?.message || err);
        }
    };

    private testInternalMinio = async (): Promise<StorageTestResponseDto> => {
        const startTime = Date.now();

        try {
            const sts = await this.k8sClient.appsApi.readNamespacedStatefulSet({
                name: STORAGE_DEFAULTS.STATEFULSET_NAME,
                namespace: STORAGE_DEFAULTS.INFRA_NAMESPACE
            });

            const replicas = sts.spec?.replicas ?? 0;
            const readyReplicas = sts.status?.readyReplicas ?? 0;
            const responseTimeMs = Date.now() - startTime;

            if (replicas === 0) {
                return {
                    success: false,
                    message: "A belső MinIO szolgáltatás jelenleg le van állítva (0 replika).",
                    responseTimeMs,
                    statusCode: 503
                };
            }

            if (readyReplicas < 1) {
                return {
                    success: false,
                    message: `A belső MinIO pod még nem üzemkész (kész replikák: ${readyReplicas}/${replicas}).`,
                    responseTimeMs,
                    statusCode: 503
                };
            }

            await this.auditService.logAudit("STORAGE_TEST_CONNECTION", "Belső MinIO kapcsolatteszt sikeres", "SUCCESS");

            return {
                success: true,
                message: "A belső MinIO K8s szolgáltatás fut és elérhető.",
                responseTimeMs,
                statusCode: 200
            };
        } catch (err) {
            const responseTimeMs = Date.now() - startTime;
            return {
                success: false,
                message: `Hiba a belső tárhely elérésekor: ${(err as any)?.message || err}`,
                responseTimeMs,
                statusCode: 500
            };
        }
    };

    private testExternalS3 = async (dto: StorageTestRequestDto): Promise<StorageTestResponseDto> => {
        const startTime = Date.now();
        const endpoint = dto.endpoint?.trim();

        if (!endpoint) {
            return {
                success: false,
                message: "A külső S3 végpont (Endpoint URL) megadása kötelező a kapcsolatteszt elvégzéséhez.",
                responseTimeMs: 0
            };
        }

        let url: URL;
        try {
            url = new URL(endpoint);
        } catch (err: any) {
            return {
                success: false,
                message: `Érvénytelen végpont URL formátum (${endpoint}): ${err.message}`,
                responseTimeMs: Date.now() - startTime,
                statusCode: 400
            };
        }

        const targetUrl = dto.bucket ? `${url.origin}/${dto.bucket.trim()}` : url.origin;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), STORAGE_LIMITS.FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(targetUrl, {
                method: "HEAD",
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const responseTimeMs = Date.now() - startTime;

            await this.auditService.logAudit(
                "STORAGE_TEST_CONNECTION",
                `Külső S3 kapcsolatteszt (${endpoint}): HTTP ${response.status}`,
                "SUCCESS"
            );

            return {
                success: true,
                message: `A külső S3 végpont elérhető és sikeresen válaszolt (HTTP ${response.status}).`,
                responseTimeMs,
                statusCode: response.status
            };
        } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            return this.tcpPing(url, startTime, fetchErr);
        }
    };

    private tcpPing = (url: URL, startTime: number, initialError?: any): Promise<StorageTestResponseDto> => {
        return new Promise<StorageTestResponseDto>((resolve) => {
            const port = url.port ? parseInt(url.port, 10) : (url.protocol === "https:" ? 443 : 80);
            const socket = new net.Socket();
            let finished = false;

            const cleanup = () => {
                if (finished) return true;
                finished = true;
                socket.destroy();
                return false;
            };

            socket.setTimeout(STORAGE_LIMITS.SOCKET_TIMEOUT_MS);

            socket.connect(port, url.hostname, () => {
                if (cleanup()) return;
                const responseTimeMs = Date.now() - startTime;
                resolve({
                    success: true,
                    message: `A TCP kapcsolat sikeres a gazdagéppel (${url.hostname}:${port}).`,
                    responseTimeMs,
                    statusCode: 200
                });
            });

            socket.on("error", (sockErr) => {
                if (cleanup()) return;
                const responseTimeMs = Date.now() - startTime;
                const errMsg = sockErr.message || initialError?.message || "Ismeretlen hálózati hiba";
                resolve({
                    success: false,
                    message: `Nem sikerült kapcsolatot létesíteni (${url.hostname}:${port}): ${errMsg}`,
                    responseTimeMs,
                    statusCode: 504
                });
            });

            socket.on("timeout", () => {
                if (cleanup()) return;
                const responseTimeMs = Date.now() - startTime;
                resolve({
                    success: false,
                    message: `Kapcsolódási időtúllépés a végpont felé (${url.hostname}:${port}).`,
                    responseTimeMs,
                    statusCode: 504
                });
            });
        });
    };
}
