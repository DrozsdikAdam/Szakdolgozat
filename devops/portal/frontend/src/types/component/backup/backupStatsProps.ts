import type { BackupResponseDto } from "../../backup"

export interface BackupStatsProps {
    totalCount: number
    latestBackup: BackupResponseDto
    syncedCount: number
}