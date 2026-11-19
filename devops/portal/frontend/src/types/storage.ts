export type StorageMode = 'internal' | 'external';

export type StorageOverViewStatus = 'Running' | 'Stopped' | 'Pending' | 'Error';

export interface StorageOverViewDto {
    mode: StorageMode;
    internal: {
        status: StorageOverViewStatus;
        replicas: number;
        allocatedSizeGb: number;
        maxAllowedSizeGb: number;
        minAllowedSizeGb: number;
        endpoint: string;
        bucketName: string;
        serviceHealthy: boolean;
    };
    external: {
        endpoint: string;
        bucketName: string;
        region: string;
        accessKeyMasked: string;
        isConfigured: boolean;
    };
}

export interface StorageConfigUpdateDto {
    mode: StorageMode;
    internalSizeGb?: number;
    externalEndpoint?: string;
    externalBucket?: string;
    externalRegion?: string;
    externalAccessKey?: string;
    externalSecretKey?: string;
    scaleDownInternal?: boolean;
}

export interface StorageTestRequestDto {
    mode: StorageMode;
    endpoint?: string;
    bucket?: string;
    accessKey?: string;
    secretKey?: string;
}

export interface StorageTestResponseDto {
    success: boolean;
    message: string;
    responseTimeMs: number;
    statusCode?: number;
}

export interface StorageFormData {
    mode: StorageMode;
    internalSizeGb: number;
    externalEndpoint: string;
    externalBucket: string;
    externalRegion: string;
    externalAccessKey: string;
    externalSecretKey: string;
    scaleDownInternal: boolean;
}
