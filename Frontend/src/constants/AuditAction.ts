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
        badgeStyle: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
    },
    UPDATE: {
        key: "UPDATE",
        label: "Módosítás",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    DELETE: {
        key: "DELETE",
        label: "Törlés",
        badgeStyle: "bg-red-500/10 border-red-500/20 text-red-400"
    },
    STATUS_CHANGE: {
        key: "STATUS_CHANGE",
        label: "Állapotváltozás",
        badgeStyle: "bg-amber-500/10 text-amber-400 border border-amber-500/20"
    },
    EMERGENCY_STOP: {
        key: "EMERGENCY_STOP",
        label: "Vészleállítás",
        badgeStyle: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
    },
    LOGIN: {
        key: "LOGIN",
        label: "Belépés",
        badgeStyle: "bg-slate-800 text-slate-300 border border-slate-700"
    },
    LOGOUT: {
        key: "LOGOUT",
        label: "Kilépés",
        badgeStyle: "bg-slate-800 text-slate-300 border border-slate-700"
    },
    STOCK_ADJUSTMENT: {
        key: "STOCK_ADJUSTMENT",
        label: "Készlet módosítás",
        badgeStyle: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    },
    STOCK_RESERVED: {
        key: "STOCK_RESERVED",
        label: "Készlet lefoglalva",
        badgeStyle: "bg-slate-800 text-slate-300 border border-slate-700"
    },
    STOCK_CONSUMED: {
        key: "STOCK_CONSUMED",
        label: "Készlet felhasználva",
        badgeStyle: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    },
    MAINTENANCE_LOG: {
        key: "MAINTENANCE_LOG",
        label: "Karbantartási napló",
        badgeStyle: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
    }
}

export const AUDIT_ACTION_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getAuditActionLabel = (type?: AuditAction) => type ? TYPES[type].label : "Ismeretlen";

export const getAuditActionBadgeStyle = (type?: AuditAction) => type ? TYPES[type].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";