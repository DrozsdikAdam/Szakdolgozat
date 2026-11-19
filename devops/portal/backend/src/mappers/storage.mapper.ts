import { STORAGE_DEFAULTS, STORAGE_LIMITS, STORAGE_CONFIG_KEYS } from "../constants/storage.constants.js";
import type { SystemConfigKey } from "../types/setup.types.js";
import type {
    StorageConfigUpdateDto,
    StorageMode,
    StorageOverViewDto,
    StorageOverViewStatus
} from "../types/storage.types.js";

export interface ParsedStorageConfig {
    mode: StorageMode;
    savedInternalSizeGb: number;
    externalEndpoint: string;
    externalBucket: string;
    externalRegion: string;
    externalAccessKey: string;
    scaleDownInternal: boolean;
}

export interface ToStorageOverviewDtoParams {
    config: ParsedStorageConfig;
    liveStatus: StorageOverViewStatus;
    liveReplicas: number;
    allocatedSizeGb: number;
    serviceHealthy: boolean;
}

export class StorageMapper {
    static maskAccessKey(key?: string): string {
        if (!key) return "";
        if (key.length <= 6) return "****";
        return `${key.slice(0, 4)}****${key.slice(-4)}`;
    }

    static parseStorageSizeGb(rawStr?: string, fallback: number = STORAGE_LIMITS.DEFAULT_SIZE_GB): number {
        if (!rawStr) return fallback;
        const match = rawStr.match(/^(\d+)/);
        if (!match || !match[1]) return fallback;
        const parsed = parseInt(match[1], 10);
        return isNaN(parsed) ? fallback : parsed;
    }

    static resolveStatefulSetStatus(replicas: number, readyReplicas: number): StorageOverViewStatus {
        if (replicas === 0) return "Stopped";
        if (readyReplicas >= 1) return "Running";
        return "Pending";
    }

    static parseSavedConfig(configMap: Map<string, string>): ParsedStorageConfig {
        const mode = (configMap.get(STORAGE_CONFIG_KEYS.MODE) as StorageMode) || STORAGE_DEFAULTS.DEFAULT_MODE;
        const savedInternalSizeGb = this.parseStorageSizeGb(
            configMap.get(STORAGE_CONFIG_KEYS.INTERNAL_SIZE_GB),
            STORAGE_LIMITS.DEFAULT_SIZE_GB
        );
        const externalEndpoint = configMap.get(STORAGE_CONFIG_KEYS.EXTERNAL_ENDPOINT) || "";
        const externalBucket = configMap.get(STORAGE_CONFIG_KEYS.EXTERNAL_BUCKET) || "";
        const externalRegion = configMap.get(STORAGE_CONFIG_KEYS.EXTERNAL_REGION) || STORAGE_DEFAULTS.EXTERNAL_DEFAULT_REGION;
        const externalAccessKey = configMap.get(STORAGE_CONFIG_KEYS.EXTERNAL_ACCESS_KEY) || "";
        const scaleDownInternal = configMap.get(STORAGE_CONFIG_KEYS.SCALE_DOWN_INTERNAL) === "true";

        return {
            mode,
            savedInternalSizeGb,
            externalEndpoint,
            externalBucket,
            externalRegion,
            externalAccessKey,
            scaleDownInternal
        };
    }

    static toOverviewDto(params: ToStorageOverviewDtoParams): StorageOverViewDto {
        const { config, liveStatus, liveReplicas, allocatedSizeGb, serviceHealthy } = params;

        return {
            mode: config.mode,
            internal: {
                status: liveStatus,
                replicas: liveReplicas,
                allocatedSizeGb,
                maxAllowedSizeGb: STORAGE_LIMITS.MAX_SIZE_GB,
                minAllowedSizeGb: STORAGE_LIMITS.MIN_SIZE_GB,
                endpoint: STORAGE_DEFAULTS.INTERNAL_ENDPOINT,
                bucketName: STORAGE_DEFAULTS.INTERNAL_BUCKET,
                serviceHealthy
            },
            external: {
                endpoint: config.externalEndpoint,
                bucketName: config.externalBucket,
                region: config.externalRegion,
                accessKeyMasked: this.maskAccessKey(config.externalAccessKey),
                isConfigured: Boolean(config.externalEndpoint && config.externalBucket)
            }
        };
    }

    static toExternalConfigEntries(dto: StorageConfigUpdateDto): Array<{ key: SystemConfigKey; value: string }> {
        const entries: Array<{ key: SystemConfigKey; value: string }> = [
            { key: STORAGE_CONFIG_KEYS.MODE, value: "external" }
        ];

        const fieldMappings: Array<[SystemConfigKey, string | undefined]> = [
            [STORAGE_CONFIG_KEYS.EXTERNAL_ENDPOINT, dto.externalEndpoint],
            [STORAGE_CONFIG_KEYS.EXTERNAL_BUCKET, dto.externalBucket],
            [STORAGE_CONFIG_KEYS.EXTERNAL_REGION, dto.externalRegion],
            [STORAGE_CONFIG_KEYS.EXTERNAL_ACCESS_KEY, dto.externalAccessKey],
            [STORAGE_CONFIG_KEYS.EXTERNAL_SECRET_KEY, dto.externalSecretKey]
        ];

        for (const [key, val] of fieldMappings) {
            if (val !== undefined) {
                entries.push({ key, value: val.trim() });
            }
        }

        if (dto.scaleDownInternal !== undefined) {
            entries.push({
                key: STORAGE_CONFIG_KEYS.SCALE_DOWN_INTERNAL,
                value: String(dto.scaleDownInternal)
            });
        }

        return entries;
    }
}
