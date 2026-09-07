import type { MachineType } from "../types/machine/MachineStatus";

export interface TypeDefinition {
    key: MachineType,
    label: "CNC Megmunkáló" | "Fröccsöntő Gép" | "Összeszerelő Sor" | "Csomagoló Gép" | "Lézervágó" | "Robot kar" | "Hegesztőgép",
    badgeStyle: string
}

export const TYPES: Record<MachineType, TypeDefinition> = {
    CNC: {
        key: "CNC",
        label: "CNC Megmunkáló",
        badgeStyle: "badge-warning"
    },
    INJECTION_MOLDING: {
        key: "INJECTION_MOLDING",
        label: "Fröccsöntő Gép",
        badgeStyle: "badge-purple"
    },
    ASSEMBLY: {
        key: "ASSEMBLY",
        label: "Összeszerelő Sor",
        badgeStyle: "badge-success"
    },
    LASER_CUTTER: {
        key: "LASER_CUTTER",
        label: "Lézervágó",
        badgeStyle: "badge-blue"
    },
    PACKAGING: {
        key: "PACKAGING",
        label: "Csomagoló Gép",
        badgeStyle: "badge-info"
    },
    ROBOT: {
        key: "ROBOT",
        label: "Robot kar",
        badgeStyle: "badge-yellow"
    },
    WELDING: {
        key: "WELDING",
        label: "Hegesztőgép",
        badgeStyle: "badge-danger"
    },
}

export const MACHINE_TYPE_OPTIONS: TypeDefinition[] = Object.values(TYPES)

export const getMachineTypeLabel = (type?: MachineType) => type ? TYPES[type]?.label ?? "Ismeretlen" : "Ismeretlen";

export const getMachineTypeBadgeStyle = (type?: MachineType) => type ? TYPES[type]?.badgeStyle ?? "badge-neutral" : "badge-neutral";