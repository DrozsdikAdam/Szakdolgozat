import type { MachineStatus, MachineType } from "./MachineStatus";

export interface MachineResponse {
    id: string,
    name: string,
    code: string,
    type: MachineType,
    status: MachineStatus,
    idealCycleTimeSeconds: number,
    targetPcsPerHour: number,
    active: boolean,
    manufacturer?: string,
    model?: string,
    serialNumber?: string,
    warrantyNumber?: string,
    warrantyEndDate?: string,
    location?: string,
    assignedUserId?: string,
    assignedUserName?: string
}

export interface MachineCreateRequest {
    name: string,
    code: string,
    type: MachineType,
    idealCycleTimeSeconds: number,
    targetPcsPerHour: number,
    status: MachineStatus,
    manufacturer?: string,
    model?: string,
    serialNumber?: string,
    warrantyNumber?: string,
    warrantyEndDate?: string,
    location?: string,
    assignedUserId?: string,
}

export interface MachineUpdateRequest {
    name?: string,
    code?: string,
    type?: MachineType,
    status?: MachineStatus,
    idealCycleTimeSeconds?: number,
    targetPcsPerHour?: number,
    manufacturer?: string,
    model?: string,
    serialNumber?: string,
    warrantyNumber?: string,
    warrantyEndDate?: string,
    location?: string,
    assignedUserId?: string,
}

export interface MachineStatusUpdateRequest {
    status: MachineStatus,
}