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