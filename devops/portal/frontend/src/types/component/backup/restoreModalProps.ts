import type { BackupResponseDto } from "../../backup"

export interface RestoreModalProps {
    isOpen: boolean
    backup: BackupResponseDto | null
    isLoading: boolean
    onConfirm: () => void
    onClose: () => void
}