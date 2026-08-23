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
    machines: MachineResponse[]
    technicians: UserResponse[]
}

export interface MaintenanceStatusModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    maintenance: MachineMaintenanceResponse | null
    technicians: UserResponse[]
}

export interface MaintenanceStatusBadgeProps {
    status: MaintenanceStatus
}

export interface MaintenanceTypeBadgeProps {
    type: MaintenanceType
}