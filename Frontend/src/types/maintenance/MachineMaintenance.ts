import type { MaintenanceStatus, MaintenanceType } from "./MaintenanceStatus";

export interface MachineMaintenanceResponse {
    id: string,
    machineId: string,
    machineCode: string,
    machineName: string,
    title: string,
    status: MaintenanceStatus,
    type: MaintenanceType,
    createdAt: string,
    updatedAt: string,
    technicianId?: string,
    technicianName?: string,
    description?: string,
    rootCause?: string,
    actionTaken?: string,
    downtimeMinutes?: number,
    cost?: number,
    start?: string,
    end?: string
}

export interface MachineMaintenanceCreateRequest {
    machineId: string,
    title: string,
    type: MaintenanceType,
    technicianId?: string,
    description?: string,
    start?: string,
    end?: string
}

export interface MachineMaintenanceUpdateRequest {
    machineId?: string,
    title?: string,
    type?: MaintenanceType,
    technicianId?: string,
    description?: string,
    start?: string,
    end?: string,
    status?: MaintenanceStatus,
    rootCause?: string,
    actionTaken?: string,
    downtimeMinutes?: number,
    cost?: number
}

export interface MachineMaintenanceUpdateStatusRequest {
    status: MaintenanceStatus,
    rootCause?: string,
    actionTaken?: string,
    technicianId?: string,
    downtimeMinutes?: number,
    cost?: number,
    end?: string
}