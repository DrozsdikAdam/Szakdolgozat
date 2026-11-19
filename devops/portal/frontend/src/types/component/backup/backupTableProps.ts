import type { BackupResponseDto } from "../../backup";

export interface BackupTableProps {
    backups: BackupResponseDto[]
    isLoading: boolean
    searchQuery: string
    onSelectRestore: (backup: BackupResponseDto) => void
}