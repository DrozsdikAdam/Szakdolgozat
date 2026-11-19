import type { BackupResponseDto } from "../../backup"

export interface BackupStatsProps {
    totalCount: number
    latestBackup: BackupResponseDto | null | undefined
    syncedCount: number
}