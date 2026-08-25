import type { MachineStatus } from "../types/machine/MachineStatus";

export interface StatusDefinition {
    key: MachineStatus,
    label: "Termel" | "Készenlétben" | "Karbantartás alatt" | "Hiba" | "Kikapcsolva",
    badgeStyle: string,
}

export const MACHINE_STATUSES: Record<MachineStatus, StatusDefinition> = {
    RUNNING: {
        key: "RUNNING",
        label: "Termel",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    },
    IDLE: {
        key: "IDLE",
        label: "Készenlétben",
        badgeStyle: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
    MAINTENANCE: {
        key: "MAINTENANCE",
        label: "Karbantartás alatt",
        badgeStyle: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    },
    ERROR: {
        key: "ERROR",
        label: "Hiba",
        badgeStyle: "bg-red-500/10 border-red-500/20 text-red-400",
    },
    OFFLINE: {
        key: "OFFLINE",
        label: "Kikapcsolva",
        badgeStyle: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    },
}

export const MACHINE_STATUS_OPTIONS: StatusDefinition[] = Object.values(MACHINE_STATUSES)

export const getMachineStatusLabel = (status?: MachineStatus) => status ? MACHINE_STATUSES[status].label : "Ismeretlen";

export const getMachineStatusBadgeStyle = (status?: MachineStatus) => status ? MACHINE_STATUSES[status].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";