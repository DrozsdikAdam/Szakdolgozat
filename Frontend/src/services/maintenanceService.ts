import type { MachineMaintenanceCreateRequest, MachineMaintenanceResponse, MachineMaintenanceUpdateRequest, MachineMaintenanceUpdateStatusRequest } from "../types/maintenance/MachineMaintenance";
import type { MaintenanceStatus } from "../types/maintenance/MaintenanceStatus";
import { apiFetch } from "../utils/apiFetch";

const baseUrl = "/api/maintenance";

export const getMaintenances = async (): Promise<MachineMaintenanceResponse[]> => {
    const response: MachineMaintenanceResponse[] = await apiFetch(baseUrl);
    return response;
}

export const getMaintenance = async (id: string): Promise<MachineMaintenanceResponse> => {
    const response: MachineMaintenanceResponse = await apiFetch(`${baseUrl}/${id}`);
    return response;
}

export const getMaintenancesByMachineId = async (machineId: string): Promise<MachineMaintenanceResponse[]> => {
    const response: MachineMaintenanceResponse[] = await apiFetch(`${baseUrl}/machine/${machineId}`);
    return response;
}

export const getMaintenanceByTechnicianId = async (technicianId: string): Promise<MachineMaintenanceResponse[]> => {
    const response: MachineMaintenanceResponse[] = await apiFetch(`${baseUrl}/technician/${technicianId}`);
    return response
}

export const getMaintenancesByStatus = async (status: MaintenanceStatus): Promise<MachineMaintenanceResponse[]> => {
    const response: MachineMaintenanceResponse[] = await apiFetch(`${baseUrl}/status/${status}`);
    return response
}

export const createMaintenance = async (request: MachineMaintenanceCreateRequest): Promise<MachineMaintenanceResponse> => {
    const response: MachineMaintenanceResponse = await apiFetch(baseUrl, {
        method: "POST",
        body: JSON.stringify(request)
    })
    return response;
}

export const updateMaintenance = async (id: string, request: MachineMaintenanceUpdateRequest) => {
    const response: MachineMaintenanceResponse = await apiFetch(`${baseUrl}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(request)
    })
    return response;
}

export const updateMaintenanceStatus = async (id: string, request: MachineMaintenanceUpdateStatusRequest) => {
    const response: MachineMaintenanceResponse = await apiFetch(`${baseUrl}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(request)
    })
    return response;
}

export const deleteMaintenance = async (id: string) => {
    await apiFetch(`${baseUrl}/${id}`, {
        method: "DELETE"
    })
}

