export type ResolutionStrategy = 'CLIENT_WINS' | 'SERVER_WINS' | 'MANUAL_MERGE';

export type QuarantineStatus = 'CONFLICT' | 'RESOLVED' | 'DISCARDED';

export type SyncItemStatus = 'APPLIED' | 'CONFLICT' | 'SKIPPED' | 'ERROR';

export interface QuarantineItemResponse {
    id: string;
    operationId: string;
    entityName: string;
    entityId: string | null;
    httpMethod: string;
    endpointUrl: string;
    payloadJson: string;
    serverStateJson: string | null;
    errorMessage: string | null;
    status: QuarantineStatus;
    retryCount: number;
    resolutionStrategy: ResolutionStrategy | null;
    resolvedBy: string | null;
    createdAt: string;
    updatedAt: string | null;
    resolvedAt: string | null;
}

export interface ConflictResolutionRequest {
    strategy: ResolutionStrategy;
    mergedPayloadJson?: string;
    resolvedBy?: string;
}

export interface SyncItemDto {
    operationId: string;
    entityName: string;
    entityId?: string | null;
    httpMethod: string;
    endpointUrl: string;
    payloadJson?: string;
    clientVersion?: number | null;
    clientTimestamp?: string;
}

export interface SyncBatchRequestDto {
    items: SyncItemDto[];
    deviceId?: string;
    submittedBy?: string;
}

export interface SyncItemResultDto {
    operationId: string;
    entityName: string;
    entityId: string | null;
    status: SyncItemStatus;
    quarantineId: string | null;
    message: string | null;
}

export interface SyncBatchResponseDto {
    totalProcessed: number;
    successCount: number;
    conflictCount: number;
    skippedCount: number;
    results: SyncItemResultDto[];
    processedAt: string;
}
