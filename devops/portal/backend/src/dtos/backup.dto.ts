import type { BackupStatus } from "../types/backup.types.js"

export interface BackupCatalogItemDto {
    id: string
    filename: string
    size: number
    status: BackupStatus
    createdAt: string
}

export interface BackupHistoryResponseDto {
    backups: BackupCatalogItemDto[]
    totalCount: number
    latestBackup?: BackupCatalogItemDto
}

export interface JobTriggerResponseDto {
    jobName: string
    message: string
}