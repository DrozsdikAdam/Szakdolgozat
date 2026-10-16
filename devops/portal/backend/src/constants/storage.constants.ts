import type { StorageMode } from "../types/storage.types.js";

export const STORAGE_LIMITS = {
    MIN_SIZE_GB: 1,
    MAX_SIZE_GB: 10,
    DEFAULT_SIZE_GB: 5,
    FETCH_TIMEOUT_MS: 5000,
    SOCKET_TIMEOUT_MS: 4000
} as const;

export const STORAGE_DEFAULTS = {
    INFRA_NAMESPACE: "platform-infra",
    STATEFULSET_NAME: "app-storage",
    PVC_NAME: "app-storage-pvc",
    SERVICE_NAME: "app-storage",
    SECRET_NAME: "app-storage-secret",
    DEFAULT_MODE: "internal" as StorageMode,
    INTERNAL_BUCKET: "mes-app-storage",
    INTERNAL_ENDPOINT: "http://app-storage.platform-infra.svc.cluster.local:9000",
    EXTERNAL_DEFAULT_REGION: "us-east-1"
} as const;

export const STORAGE_CONFIG_KEYS = {
    MODE: "storage_mode",
    INTERNAL_SIZE_GB: "storage_internal_size_gb",
    EXTERNAL_ENDPOINT: "storage_external_endpoint",
    EXTERNAL_BUCKET: "storage_external_bucket",
    EXTERNAL_REGION: "storage_external_region",
    EXTERNAL_ACCESS_KEY: "storage_external_access_key",
    EXTERNAL_SECRET_KEY: "storage_external_secret_key",
    SCALE_DOWN_INTERNAL: "storage_scale_down_internal"
} as const;
