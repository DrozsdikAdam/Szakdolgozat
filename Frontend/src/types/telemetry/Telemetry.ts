import type { MachineStatus } from "../machine/MachineStatus";

export interface TelemertyResponse {
    id: string,
    machineId: string,
    machineCode: string,
    machineName: string,
    temperature: number,
    pressureBar: number,
    vibration: number,
    powerKw: number,
    producedCount: number,
    scrapCount: number,
    status: MachineStatus,
    timestamp: string
    activeWorkOrderNumber?: string
}

export interface OeeResponse {
    availabilityPercentage: number,
    performancePercentage: number,
    qualityPercentage: number,
    oeePercentage: number,
    totalProducedCount: number,
    totalScrapCount: number,
    uptimeMinutes: number,
    downtimeMinutes: number
}