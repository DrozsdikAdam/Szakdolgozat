import type { MaintenanceStatus } from "../types/maintenance/MaintenanceStatus";

export interface StatusDefinition {
    key: MaintenanceStatus,
    label: "Tervezett" | "Folyamatban" | "Befejezett" | "Törölt",
    badgeStyle: string,
    level: number
}

export const STATUSES: Record<MaintenanceStatus, StatusDefinition> = {
    SCHEDULED: {
        key: "SCHEDULED",
        label: "Tervezett",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        level: 4
    },
    IN_PROGRESS: {
        key: "IN_PROGRESS",
        label: "Folyamatban",
        badgeStyle: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        level: 3
    },
    COMPLETED: {
        key: "COMPLETED",
        label: "Befejezett",
        badgeStyle: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        level: 2
    },
    CANCELLED: {
        key: "CANCELLED",
        label: "Törölt",
        badgeStyle: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        level: 1
    },
}

export const STATUS_OPTIONS: StatusDefinition[] = Object.values(STATUSES)

export const getMaintenanceStatusLabel = (status?: MaintenanceStatus) => status ? STATUSES[status].label : "Ismeretlen";

export const getMaintenanceStatusBadgeStyle = (status?: MaintenanceStatus) => status ? STATUSES[status].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";