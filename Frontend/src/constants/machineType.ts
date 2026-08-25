import type { MachineType } from "../types/machine/MachineStatus";

export interface TypeDefinition {
    key: MachineType,
    label: "CNC Megmunkáló" | "Fröccsöntő Gép" | "Összeszerelő Sor" | "Csomagoló Gép" | "Lézervágó" | "Robota kar" | "Hegesztőgép",
    badgeStyle: string
}

export const TYPES: Record<MachineType, TypeDefinition> = {
    CNC: {
        key: "CNC",
        label: "CNC Megmunkáló",
        badgeStyle: "bg-orange-500/10 border-orange-500/20 text-orange-400"

    },
    INJECTION_MOLDING: {
        key: "INJECTION_MOLDING",
        label: "Fröccsöntő Gép",
        badgeStyle: "bg-purple-500/10 border-purple-500/20 text-purple-400"
    },
    ASSEMBLY: {
        key: "ASSEMBLY",
        label: "Összeszerelő Sor",
        badgeStyle: "bg-green-500/10 border-green-500/20 text-green-400"
    },
    LASER_CUTTER: {
        key: "LASER_CUTTER",
        label: "Lézervágó",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    PACKAGING: {
        key: "PACKAGING",
        label: "Csomagoló Gép",
        badgeStyle: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
    },
    ROBOT: {
        key: "ROBOT",
        label: "Robota kar",
        badgeStyle: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
    },
    WELDING: {
        key: "WELDING",
        label: "Hegesztőgép",
        badgeStyle: "bg-red-500/10 border-red-500/20 text-red-400"
    },
}

export const TYPE_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getMachineTypeLabel = (type?: MachineType) => type ? TYPES[type].label : "Ismeretlen";

export const getMachineTypeBadgeStyle = (type?: MachineType) => type ? TYPES[type].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";