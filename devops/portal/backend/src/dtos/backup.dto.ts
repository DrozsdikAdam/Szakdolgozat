import type { BackupStatus } from "../types/backup.types.js"

export interface BackupResponseDto {
    id: string
    filename: string
    size: number
    status: BackupStatus
    s3Path: string
    createdAt: string
    updatedAt: string
}

export interface BackupHistoryResponseDto {
    backups: BackupResponseDto[]
    totalCount: number
    latestBackup?: BackupResponseDto | undefined
}

export interface JobTriggerResponseDto {
    jobName: string
    message: string
}

export type BackupStorageMode = "internal" | "external";

export interface BackupTargetDto {
    mode: BackupStorageMode;
    endpoint: string;
    bucket: string;
    accessKeyMasked?: string;
    region?: string;
    isReady?: boolean;
}

export interface BackupTargetUpdateDto {
    mode: BackupStorageMode;
    endpoint?: string;
    bucket?: string;
    accessKey?: string;
    secretKey?: string;
    region?: string;
}

export interface BackupTargetTestDto {
    mode: BackupStorageMode;
    endpoint?: string;
    bucket?: string;
    accessKey?: string;
    secretKey?: string;
    region?: string;
}

export interface BackupTargetTestResultDto {
    success: boolean;
    message: string;
    latencyMs?: number;
}
