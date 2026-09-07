import type { EmergencyStopRequest, MachineCreateRequest, MachineResponse, MachineStatusUpdateRequest, MachineUpdateRequest } from "../types/machine/Machine"
import type { MachineStatus, MachineType } from "../types/machine/MachineStatus"
import { apiFetch } from "../utils/apiFetch"
import type { PagedResponse } from "../types/common/PagedResponse"
import { offlineDb } from "./offlineDb"
import type { CachedMachine } from "../types/offline/offline"
import { fetchPagedWithOfflineCache, fetchItemWithOfflineCache, mutateWithOfflineQueue } from "../utils/offlineHelper"

const baseUrl = "/api/machines"

const mapCachedToMachineResponse = (m: CachedMachine): MachineResponse => ({
    id: m.id,
    name: m.name,
    code: m.code,
    type: m.type as MachineType,
    status: m.status as MachineStatus,
    idealCycleTimeSeconds: m.idealCycleTimeSeconds,
    targetPcsPerHour: m.targetPcsPerHour,
    active: m.active,
    manufacturer: m.manufacturer,
    model: m.model,
    serialNumber: m.serialNumber,
    warrantyNumber: m.warrantyNumber,
    warrantyEndDate: m.warrantyEndDate,
    location: m.location,
    assignedUserId: m.assignedUserId,
    assignedUserName: m.assignedUserName
})

const mapResponseToCache = (m: MachineResponse): CachedMachine => ({
    id: m.id,
    name: m.name,
    code: m.code,
    type: m.type,
    status: m.status,
    idealCycleTimeSeconds: m.idealCycleTimeSeconds,
    targetPcsPerHour: m.targetPcsPerHour,
    active: m.active,
    manufacturer: m.manufacturer,
    model: m.model,
    serialNumber: m.serialNumber,
    warrantyNumber: m.warrantyNumber,
    warrantyEndDate: m.warrantyEndDate,
    location: m.location,
    assignedUserId: m.assignedUserId,
    assignedUserName: m.assignedUserName,
    lastUpdated: Date.now()
})

export const getMachines = async (page: number = 0, size: number = 10): Promise<PagedResponse<MachineResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
    return fetchPagedWithOfflineCache({
        url: `${baseUrl}?${params.toString()}`,
        table: offlineDb.cachedMachines,
        mapToResponse: mapCachedToMachineResponse,
        mapToCache: mapResponseToCache
    })
}

export const getInactiveMachines = async () => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedMachines.filter(m => !m.active).toArray()
        return cached.map(mapCachedToMachineResponse)
    }
    return apiFetch<MachineResponse[]>(`${baseUrl}/inactive`)
}

export const getDeletedMachines = async () => {
    return apiFetch<MachineResponse[]>(`${baseUrl}/deleted`)
}

export const getMachineById = async (id: string) => {
    return fetchItemWithOfflineCache({
        url: `${baseUrl}/${id}`,
        getCached: () => offlineDb.cachedMachines.get(id),
        mapToResponse: mapCachedToMachineResponse,
        mapToCache: mapResponseToCache,
        saveToCache: (item) => offlineDb.cachedMachines.put(item)
    })
}

export const getMachinesByStatus = async (status: MachineStatus) => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedMachines.where("status").equals(status).toArray()
        return cached.map(mapCachedToMachineResponse)
    }
    return apiFetch<MachineResponse[]>(`${baseUrl}/status/${status}`)
}

export const getMachinesByType = async (type: MachineType) => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedMachines.where("type").equals(type).toArray()
        return cached.map(mapCachedToMachineResponse)
    }
    return apiFetch<MachineResponse[]>(`${baseUrl}/type/${type}`)
}

export const getMachinesByUserId = async (userId: string) => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedMachines.where("assignedUserId").equals(userId).toArray()
        return cached.map(mapCachedToMachineResponse)
    }
    return apiFetch<MachineResponse[]>(`${baseUrl}/user/${userId}`)
}

export const createMachine = async (request: MachineCreateRequest): Promise<MachineResponse> => {
    return mutateWithOfflineQueue<MachineResponse>({
        url: baseUrl,
        method: "POST",
        payload: request,
        entityName: `Gép létrehozása: ${request.name}`,
        applyOptimistic: async () => {
            const newMachine: CachedMachine = {
                id: crypto.randomUUID(),
                name: request.name,
                code: request.code,
                type: request.type,
                status: request.status,
                idealCycleTimeSeconds: request.idealCycleTimeSeconds,
                targetPcsPerHour: request.targetPcsPerHour,
                active: true,
                manufacturer: request.manufacturer,
                model: request.model,
                serialNumber: request.serialNumber,
                warrantyNumber: request.warrantyNumber,
                warrantyEndDate: request.warrantyEndDate,
                location: request.location,
                assignedUserId: request.assignedUserId,
                lastUpdated: Date.now()
            }
            await offlineDb.cachedMachines.put(newMachine)
            return mapCachedToMachineResponse(newMachine)
        },
        onSuccess: async (res) => {
            await offlineDb.cachedMachines.put(mapResponseToCache(res))
        }
    })
}

export const updateMachine = async (id: string, request: MachineUpdateRequest): Promise<MachineResponse> => {
    return mutateWithOfflineQueue<MachineResponse>({
        url: `${baseUrl}/${id}`,
        method: "PATCH",
        payload: request,
        entityName: `Gép szerkesztése: ${request.name || id}`,
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedMachines.get(id)
            const updated: CachedMachine = {
                id,
                name: request.name ?? existing?.name ?? "Gép",
                code: request.code ?? existing?.code ?? "",
                type: request.type ?? existing?.type ?? "CNC",
                status: existing?.status ?? "STOPPED",
                idealCycleTimeSeconds: request.idealCycleTimeSeconds ?? existing?.idealCycleTimeSeconds ?? 60,
                targetPcsPerHour: request.targetPcsPerHour ?? existing?.targetPcsPerHour ?? 60,
                active: existing?.active ?? true,
                manufacturer: request.manufacturer ?? existing?.manufacturer,
                model: request.model ?? existing?.model,
                serialNumber: request.serialNumber ?? existing?.serialNumber,
                warrantyNumber: request.warrantyNumber ?? existing?.warrantyNumber,
                warrantyEndDate: request.warrantyEndDate ?? existing?.warrantyEndDate,
                location: request.location ?? existing?.location,
                assignedUserId: request.assignedUserId ?? existing?.assignedUserId,
                lastUpdated: Date.now()
            }
            await offlineDb.cachedMachines.put(updated)
            return mapCachedToMachineResponse(updated)
        },
        onSuccess: async (res) => {
            await offlineDb.cachedMachines.put(mapResponseToCache(res))
        }
    })
}

export const updateMachineStatus = async (id: string, request: MachineStatusUpdateRequest): Promise<MachineResponse> => {
    return mutateWithOfflineQueue<MachineResponse>({
        url: `${baseUrl}/${id}/status`,
        method: "PATCH",
        payload: request,
        actionType: "STATUS_UPDATE",
        entityName: `Gép állapot váltás: ${request.status}`,
        applyOptimistic: async () => {
            await offlineDb.cachedMachines.update(id, { status: request.status, lastUpdated: Date.now() })
            return { id, status: request.status } as unknown as MachineResponse
        },
        onSuccess: async () => {
            await offlineDb.cachedMachines.update(id, { status: request.status, lastUpdated: Date.now() })
        }
    })
}

export const assignUserToMachine = async (id: string, userId: string) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}/user/${userId}`, {
        method: "PATCH",
    })
}

export const unassignUserFromMachine = async (id: string) => {
    return apiFetch<MachineResponse>(`${baseUrl}/${id}/unassign`, {
        method: "PATCH",
    })
}

export const activateMachine = async (id: string) => {
    await mutateWithOfflineQueue<void>({
        url: `${baseUrl}/${id}/activate`,
        method: "PATCH",
        payload: null,
        entityName: "Gép aktiválása",
        applyOptimistic: async () => {
            await offlineDb.cachedMachines.update(id, { active: true, lastUpdated: Date.now() })
        }
    })
}

export const deactivateMachine = async (id: string) => {
    await mutateWithOfflineQueue<void>({
        url: `${baseUrl}/${id}/deactivate`,
        method: "PATCH",
        payload: null,
        entityName: "Gép inaktiválása",
        applyOptimistic: async () => {
            await offlineDb.cachedMachines.update(id, { active: false, lastUpdated: Date.now() })
        }
    })
}

export const deleteMachine = async (id: string) => {
    await mutateWithOfflineQueue<void>({
        url: `${baseUrl}/${id}`,
        method: "DELETE",
        payload: null,
        entityName: "Gép törlése",
        applyOptimistic: async () => {
            await offlineDb.cachedMachines.delete(id)
        }
    })
}

export const restoreMachine = async (id: string) => {
    return apiFetch<void>(`${baseUrl}/${id}/restore`, {
        method: "PATCH",
    })
}

export const emergencyStop = async (id: string, request: EmergencyStopRequest): Promise<MachineResponse> => {
    return mutateWithOfflineQueue<MachineResponse>({
        url: `${baseUrl}/${id}/emergency-stop`,
        method: "POST",
        payload: request,
        actionType: "EMERGENCY_STOP",
        entityName: "Vészleállítás!",
        applyOptimistic: async () => {
            await offlineDb.cachedMachines.update(id, { status: "EMERGENCY_STOP", lastUpdated: Date.now() })
            return { id, status: "EMERGENCY_STOP" } as unknown as MachineResponse
        },
        onSuccess: async () => {
            await offlineDb.cachedMachines.update(id, { status: "EMERGENCY_STOP", lastUpdated: Date.now() })
        }
    })
}