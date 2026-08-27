import type { EmergencyStopRequest, MachineCreateRequest, MachineResponse, MachineStatusUpdateRequest, MachineUpdateRequest } from "../types/machine/Machine"
import type { MachineStatus, MachineType } from "../types/machine/MachineStatus"
import { apiFetch } from "../utils/apiFetch"

const baseUrl = "/api/machines"

export const getMachines = async () => {
    return apiFetch<MachineResponse[]>(baseUrl)
}

export const getInactiveMachines = async () => {
    return apiFetch<MachineResponse[]>(`${baseUrl}/inactive`)
}

export const getDeletedMachines = async () => {
    return apiFetch<MachineResponse[]>(`${baseUrl}/deleted`)
}

export const getMachineById = async (id: string) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}`)
}

export const getMachinesByStatus = async (status: MachineStatus) => {
    return apiFetch<MachineResponse[]>(`${baseUrl}/status/${status}`)
}

export const getMachinesByType = async (type: MachineType) => {
    return apiFetch<MachineResponse[]>(`${baseUrl}/type/${type}`)
}

export const getMachinesByUserId = async (userId: string) => {
    return apiFetch<MachineResponse[]>(`${baseUrl}/user/${userId}`)
}

export const createMachine = async (request: MachineCreateRequest) => {
    return apiFetch<MachineResponse>(`${baseUrl}`, {
        method: "POST",
        body: JSON.stringify(request),
    })
}

export const updateMachine = async (id: string, request: MachineUpdateRequest) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(request),
    })
}

export const updateMachineStatus = async (id: string, request: MachineStatusUpdateRequest) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(request),
    })
}

export const assignUserToMachine = async (id: string, userId: string) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}/user/${userId}`, {
        method: "PATCH",
    })
}

export const unassignUserFromMachine = async (id: string) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}/user`, {
        method: "DELETE",
    })
}

export const activateMachine = async (id: string) => {
    return apiFetch<void>(`${baseUrl}/${id}/activate`, {
        method: "PATCH",
    })
}

export const deactivateMachine = async (id: string) => {
    return apiFetch<void>(`${baseUrl}/${id}/deactivate`, {
        method: "PATCH",
    })
}

export const deleteMachine = async (id: string) => {
    return apiFetch<void>(`${baseUrl}/${id}`, {
        method: "DELETE",
    })
}

export const restoreMachine = async (id: string) => {
    return apiFetch<void>(`${baseUrl}/${id}/restore`, {
        method: "PATCH",
    })
}

export const emergencyStop = async (id: string, request: EmergencyStopRequest) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}/emergency-stop`, {
        method: "POST",
        body: JSON.stringify(request),
    })
}