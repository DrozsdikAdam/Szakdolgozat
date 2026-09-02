import type { AuditEntityType } from "../types/audit/AuditLog";

export interface TypeDefinition {
    key: AuditEntityType,
    label: "Felhasználó" | "Gép" | "Munka" | "Karbantartás" | "Készlet" | "Termék" | "Robogépes tervek" | "Hitelesítés",
    badgeStyle: string
}

export const TYPES: Record<AuditEntityType, TypeDefinition> = {
    USER: {
        key: "USER",
        label: "Felhasználó",
        badgeStyle: "bg-orange-500/10 border-orange-500/20 text-orange-400"

    },
    MACHINE: {
        key: "MACHINE",
        label: "Gép",
        badgeStyle: "bg-purple-500/10 border-purple-500/20 text-purple-400"
    },
    WORKORDER: {
        key: "WORKORDER",
        label: "Munka",
        badgeStyle: "bg-green-500/10 border-green-500/20 text-green-400"
    },
    MAINTENANCE: {
        key: "MAINTENANCE",
        label: "Karbantartás",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    INVENTORY: {
        key: "INVENTORY",
        label: "Készlet",
        badgeStyle: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
    },
    PRODUCT: {
        key: "PRODUCT",
        label: "Termék",
        badgeStyle: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
    },
    BOM: {
        key: "BOM",
        label: "Robogépes tervek",
        badgeStyle: "bg-red-500/10 border-red-500/20 text-red-400"
    },
    AUTHENTICATION: {
        key: "AUTHENTICATION",
        label: "Hitelesítés",
        badgeStyle: "bg-pink-500/10 border-pink-500/20 text-pink-400"
    },
}

export const AUDIT_ENTITY_TYPE_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getAuditEntityTypeLabel = (type?: AuditEntityType) => type ? TYPES[type].label : "Ismeretlen";

export const getAuditEntityTypeBadgeStyle = (type?: AuditEntityType) => type ? TYPES[type].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";