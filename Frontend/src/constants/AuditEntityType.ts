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
        badgeStyle: "badge-warning"
    },
    MACHINE: {
        key: "MACHINE",
        label: "Gép",
        badgeStyle: "badge-purple"
    },
    WORKORDER: {
        key: "WORKORDER",
        label: "Munka",
        badgeStyle: "badge-success"
    },
    MAINTENANCE: {
        key: "MAINTENANCE",
        label: "Karbantartás",
        badgeStyle: "badge-info"
    },
    INVENTORY: {
        key: "INVENTORY",
        label: "Készlet",
        badgeStyle: "badge-blue"
    },
    PRODUCT: {
        key: "PRODUCT",
        label: "Termék",
        badgeStyle: "badge-yellow"
    },
    BOM: {
        key: "BOM",
        label: "Robogépes tervek",
        badgeStyle: "badge-danger"
    },
    AUTHENTICATION: {
        key: "AUTHENTICATION",
        label: "Hitelesítés",
        badgeStyle: "badge-neutral"
    },
}

export const AUDIT_ENTITY_TYPE_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getAuditEntityTypeLabel = (type?: AuditEntityType) => type ? TYPES[type]?.label ?? "Ismeretlen" : "Ismeretlen";

export const getAuditEntityTypeBadgeStyle = (type?: AuditEntityType) => type ? TYPES[type]?.badgeStyle ?? "badge-neutral" : "badge-neutral";