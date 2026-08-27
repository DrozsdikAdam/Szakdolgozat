import type { MachineResponse } from "../machine/Machine"
import type { UserResponse } from "../user/User"
import type { MachineMaintenanceResponse } from "./MachineMaintenance"
import type { MaintenanceStatus, MaintenanceType } from "./MaintenanceStatus"

export interface CreateMaintenanceModalProps {

    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    machines: MachineResponse[]
    technicians?: UserResponse[]
}

export interface UpdateMaintenanceModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    maintenance: MachineMaintenanceResponse | null
    technicians: UserResponse[]
}

export interface MaintenanceStatusModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    maintenance: MachineMaintenanceResponse | null
    technicians: UserResponse[]
}

export interface MaintenanceStatsCardProps {
    maintenances: MachineMaintenanceResponse[]
}

export interface MaintenanceCardProps {
    maintenance: MachineMaintenanceResponse
    onEdit: (item: MachineMaintenanceResponse) => void
    onStatusUpdate: (item: MachineMaintenanceResponse) => void
    onDelete: (id: string) => void
}

export interface MaintenanceFilterBarProps {
    searchTerm: string
    setSearchTerm: (val: string) => void
    statusFilter: MaintenanceStatus | "ALL"
    setStatusFilter: (val: MaintenanceStatus | "ALL") => void
    typeFilter: MaintenanceType | "ALL"
    setTypeFilter: (val: MaintenanceType | "ALL") => void
    onCreate: () => void
}


export interface MaintenanceStatusBadgeProps {
    status: MaintenanceStatus
}

export interface MaintenanceTypeBadgeProps {
    type: MaintenanceType
}