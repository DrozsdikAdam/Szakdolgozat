import type { MachineStatus } from "../types/machine/MachineStatus";

export interface StatusDefinition {
    key: MachineStatus,
    label: "Termel" | "Készenlétben" | "Karbantartás alatt" | "Hiba" | "Kikapcsolva" | "Leállítva",
    badgeStyle: string,
}

export const MACHINE_STATUSES: Record<MachineStatus, StatusDefinition> = {
    RUNNING: {
        key: "RUNNING",
        label: "Termel",
        badgeStyle: "badge-success",
    },
    IDLE: {
        key: "IDLE",
        label: "Készenlétben",
        badgeStyle: "badge-yellow",
    },
    MAINTENANCE: {
        key: "MAINTENANCE",
        label: "Karbantartás alatt",
        badgeStyle: "badge-warning",
    },
    ERROR: {
        key: "ERROR",
        label: "Hiba",
        badgeStyle: "badge-danger",
    },
    OFFLINE: {
        key: "OFFLINE",
        label: "Kikapcsolva",
        badgeStyle: "badge-neutral",
    },
    STOPPED: {
        key: "STOPPED",
        label: "Leállítva",
        badgeStyle: "badge-danger",
    },
}

export const MACHINE_STATUS_OPTIONS: StatusDefinition[] = Object.values(MACHINE_STATUSES)

export const getMachineStatusLabel = (status?: MachineStatus) => status ? MACHINE_STATUSES[status]?.label ?? "Ismeretlen" : "Ismeretlen";

export const getMachineStatusBadgeStyle = (status?: MachineStatus) => status ? MACHINE_STATUSES[status]?.badgeStyle ?? "badge-neutral" : "badge-neutral";