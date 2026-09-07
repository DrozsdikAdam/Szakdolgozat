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
        badgeStyle: "badge-yellow",
        level: 4
    },
    IN_PROGRESS: {
        key: "IN_PROGRESS",
        label: "Folyamatban",
        badgeStyle: "badge-warning",
        level: 3
    },
    COMPLETED: {
        key: "COMPLETED",
        label: "Befejezett",
        badgeStyle: "badge-success",
        level: 2
    },
    CANCELLED: {
        key: "CANCELLED",
        label: "Törölt",
        badgeStyle: "badge-danger",
        level: 1
    },
}

export const STATUS_OPTIONS: StatusDefinition[] = Object.values(STATUSES)

export const getMaintenanceStatusLabel = (status?: MaintenanceStatus) => status ? STATUSES[status].label : "Ismeretlen";

export const getMaintenanceStatusBadgeStyle = (status?: MaintenanceStatus) => status ? STATUSES[status].badgeStyle : "badge-neutral";