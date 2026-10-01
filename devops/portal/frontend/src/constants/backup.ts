import type { BackupStatus } from "../types/backup"
import type { BadgeProps } from "../types/component/badgeProps"

export const BACKUP_STATUS_BADGES: Record<BackupStatus, BadgeProps> = {
    SYNCED: { text: "S3 Szinkronizálva", variant: "teal", pulse: false },
    STAGED_LOCALLY: { text: "Helyi mentés", variant: "skyblue", pulse: false },
    FAILED: { text: "Sikertelen", variant: "vermillon", pulse: false },
    RESTORE_COMPLETED: { text: "Visszaállítás lefutott", variant: "orange", pulse: false },
    RESTORE_SUCCESS: { text: "Sikeresen visszatöltve", variant: "purple", pulse: true }
}
