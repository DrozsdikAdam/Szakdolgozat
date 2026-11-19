import type { BadgeProps } from "../types/component/badgeProps"

export interface AuditActionStyleConfig {
    label: string
    variant: BadgeProps['variant']
}

export const AUDIT_ACTION_CONFIG: Record<string, AuditActionStyleConfig> = {
    TOGGLE_FEATURE: { label: "Funkció Kapcsolás", variant: "skyblue" },
    SETUP_WIZARD: { label: "Rendszer Inicializálás", variant: "purple" },
    UPDATE_RATE_LIMIT: { label: "Rate Limit Módosítás", variant: "teal" },
    UPDATE_HPA: { label: "HPA Skálázás", variant: "orange" },
    UPDATE_VPA: { label: "VPA Skálázás", variant: "orange" },
    TRIGGER_BACKUP: { label: "Mentés Indítás", variant: "teal" },
    TRIGGER_RESTORE: { label: "Helyreállítás", variant: "vermillon" },
    LOGIN_ATTEMPT: { label: "Bejelentkezési Kísérlet", variant: "skyblue" },
    ROTATE_PASSWORD: { label: "Jelszó Rotálás", variant: "teal" }
}
