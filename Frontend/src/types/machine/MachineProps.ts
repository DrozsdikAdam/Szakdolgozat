import type { UserResponse } from "../user/User";
import type { MachineResponse } from "./Machine";
import type { MachineStatus, MachineType } from "./MachineStatus";

export interface CreateMachineModalProps {
    isOpen: boolean,
    onClose: () => void,
    onSuccess: () => void,
    users: UserResponse[]
}

export interface UpdateMachineModalProps {
    isOpen: boolean,
    onClose: () => void,
    onSuccess: () => void,
    machine: MachineResponse | null,
    users: UserResponse[]
}

export interface MachineCardProps {
    machine: MachineResponse,
    onEdit: (m: MachineResponse) => void,
    onDelete: (id: string) => void,
    onStatusChange: (id: string, status: MachineStatus) => void,
    users: UserResponse[],
    onAssignUser: (machineId: string, userId: string) => void
}

export interface MachineStatsCardProps {
    machines: MachineResponse[]
}

export interface MachineFilterBarProps {
    searchTerm: string, setSearchTerm: (val: string) => void,
    statusFilter: MachineStatus | "ALL",
    setStatusFilter: (val: MachineStatus | "ALL") => void,
    typeFilter: MachineType | "ALL",
    setTypeFilter: (val: MachineType | "ALL") => void,
    onCreate: () => void
}