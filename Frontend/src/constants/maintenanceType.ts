import type { MaintenanceType } from "../types/maintenance/MaintenanceStatus";

export interface TypeDefinition {
    key: MaintenanceType,
    label: "Hibajavítás" | "Megelőző",
    badgeStyle: string
}

export const TYPES: Record<MaintenanceType, TypeDefinition> = {
    CORRECTIVE: {
        key: "CORRECTIVE",
        label: "Hibajavítás",
        badgeStyle: "badge-warning"
    },
    PREVENTIVE: {
        key: "PREVENTIVE",
        label: "Megelőző",
        badgeStyle: "badge-info"
    },
}

export const TYPE_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getMaintenanceTypeLabel = (type?: MaintenanceType) => type ? TYPES[type]?.label ?? "Ismeretlen" : "Ismeretlen";

export const getMaintenanceTypeBadgeStyle = (type?: MaintenanceType) => type ? TYPES[type]?.badgeStyle ?? "badge-neutral" : "badge-neutral";