import type { MachineResponse } from "../machine/Machine"
import type { UserResponse } from "../user/User"
import type { MachineMaintenanceResponse } from "./MachineMaintenance"
import type { MaintenanceStatus } from "./MaintenanceStatus"

export interface MaintenanceModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    machines: MachineResponse[]
    technicians?: UserResponse[]
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