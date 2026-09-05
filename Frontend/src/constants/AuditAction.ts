import type { AuditAction } from "../types/audit/AuditLog";

export interface TypeDefinition {
    key: AuditAction,
    label: "Létrehozás" | "Módosítás" | "Törlés" | "Állapotváltozás" | "Vészleállítás" | "Belépés" | "Kilépés" | "Készlet módosítás" | "Készlet lefoglalva" | "Készlet felhasználva" | "Karbantartási napló",
    badgeStyle: string
}

export const TYPES: Record<AuditAction, TypeDefinition> = {
    CREATE: {
        key: "CREATE",
        label: "Létrehozás",
        badgeStyle: "badge-info"
    },
    UPDATE: {
        key: "UPDATE",
        label: "Módosítás",
        badgeStyle: "badge-blue"
    },
    DELETE: {
        key: "DELETE",
        label: "Törlés",
        badgeStyle: "badge-danger"
    },
    STATUS_CHANGE: {
        key: "STATUS_CHANGE",
        label: "Állapotváltozás",
        badgeStyle: "badge-warning"
    },
    EMERGENCY_STOP: {
        key: "EMERGENCY_STOP",
        label: "Vészleállítás",
        badgeStyle: "badge-danger"
    },
    LOGIN: {
        key: "LOGIN",
        label: "Belépés",
        badgeStyle: "badge-neutral"
    },
    LOGOUT: {
        key: "LOGOUT",
        label: "Kilépés",
        badgeStyle: "badge-neutral"
    },
    STOCK_ADJUSTMENT: {
        key: "STOCK_ADJUSTMENT",
        label: "Készlet módosítás",
        badgeStyle: "badge-warning"
    },
    STOCK_RESERVED: {
        key: "STOCK_RESERVED",
        label: "Készlet lefoglalva",
        badgeStyle: "badge-neutral"
    },
    STOCK_CONSUMED: {
        key: "STOCK_CONSUMED",
        label: "Készlet felhasználva",
        badgeStyle: "badge-success"
    },
    MAINTENANCE_LOG: {
        key: "MAINTENANCE_LOG",
        label: "Karbantartási napló",
        badgeStyle: "badge-purple"
    }
}

export const AUDIT_ACTION_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getAuditActionLabel = (type?: AuditAction) => type ? TYPES[type]?.label ?? "Ismeretlen" : "Ismeretlen";

export const getAuditActionBadgeStyle = (type?: AuditAction) => type ? TYPES[type]?.badgeStyle ?? "badge-neutral" : "badge-neutral";