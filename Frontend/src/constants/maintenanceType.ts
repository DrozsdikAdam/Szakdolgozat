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
        badgeStyle: "bg-orange-500/10 border-orange-500/20 text-orange-400"

    },
    PREVENTIVE: {
        key: "PREVENTIVE",
        label: "Megelőző",
        badgeStyle: "bg-purple-500/10 border-purple-500/20 text-purple-400"
    },
}

export const TYPE_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getMaintenanceTypeLabel = (type?: MaintenanceType) => type ? TYPES[type].label : "Ismeretlen";

export const getMaintenanceTypeBadgeStyle = (type?: MaintenanceType) => type ? TYPES[type].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";