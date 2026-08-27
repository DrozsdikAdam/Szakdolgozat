import type { UserResponse } from "../user/User";
import type { WorkOrderResponse } from "../workorder/workOrder";
import type { MachineResponse } from "./Machine";
import type { MachineStatus, MachineType } from "./MachineStatus";

export interface UpdateMachineModalProps {
    isOpen: boolean,
    onClose: () => void,
    onSuccess: () => void,
    machine: MachineResponse | null,
    users: UserResponse[]
}

export interface MachineCardProps {
    machine: MachineResponse,
    workOrders: WorkOrderResponse[],
    onEdit: (m: MachineResponse) => void,
    onDelete: (id: string) => void,
    onStatusChange: (id: string, status: MachineStatus) => void,
    onStartWorkOrder: (machineId: string, workOrderId: string, machineUserId?: string) => void,
    users: UserResponse[],
    onEmergencyStop: (id: string) => void,
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

export interface EmergencyStopModalProps {
    isOpen: boolean,
    onClose: () => void,
    onSuccess: () => void,
    machineId: string,
    technicians: UserResponse[]
}

export interface MachineStatusBadgeProps {
    status: MachineStatus,
}

export interface MachineTypeBadgeProps {
    type: MachineType,
}