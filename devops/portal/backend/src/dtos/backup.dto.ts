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