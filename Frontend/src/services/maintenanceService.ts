import type { MachineMaintenanceCreateRequest, MachineMaintenanceResponse, MachineMaintenanceUpdateRequest, MachineMaintenanceUpdateStatusRequest } from "../types/maintenance/MachineMaintenance";
import type { MaintenanceStatus, MaintenanceType } from "../types/maintenance/MaintenanceStatus";
import { apiFetch } from "../utils/apiFetch";
import type { PagedResponse } from "../types/common/PagedResponse";
import { offlineDb } from "./offlineDb";
import type { CachedMaintenance } from "../types/offline/offline";
import { fetchPagedWithOfflineCache, fetchItemWithOfflineCache, mutateWithOfflineQueue } from "../utils/offlineHelper";

const baseUrl = "/api/maintenance";

const mapCachedToMaintenanceResponse = (m: CachedMaintenance): MachineMaintenanceResponse => ({
    id: m.id,
    machineId: m.machineId,
    machineCode: m.machineCode,
    machineName: m.machineName,
    title: m.title,
    status: m.status as MaintenanceStatus,
    type: m.type as MaintenanceType,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt || new Date(m.lastUpdated).toISOString(),
    technicianId: m.technicianId,
    technicianName: m.technicianName,
    description: m.description,
    rootCause: m.rootCause,
    actionTaken: m.actionTaken,
    downtimeMinutes: m.downtimeMinutes,
    cost: m.cost,
    start: m.start,
    end: m.end
});

const mapResponseToCache = (m: MachineMaintenanceResponse): CachedMaintenance => ({
    id: m.id,
    machineId: m.machineId,
    machineCode: m.machineCode,
    machineName: m.machineName,
    title: m.title,
    status: m.status,
    type: m.type,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    technicianId: m.technicianId,
    technicianName: m.technicianName,
    description: m.description,
    rootCause: m.rootCause,
    actionTaken: m.actionTaken,
    downtimeMinutes: m.downtimeMinutes,
    cost: m.cost,
    start: m.start,
    end: m.end,
    lastUpdated: Date.now()
});

export const getMaintenances = async (page: number = 0, size: number = 10): Promise<PagedResponse<MachineMaintenanceResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return fetchPagedWithOfflineCache({
        url: `${baseUrl}?${params.toString()}`,
        table: offlineDb.cachedMaintenances,
        mapToResponse: mapCachedToMaintenanceResponse,
        mapToCache: mapResponseToCache
    });
};

export const getMaintenance = async (id: string): Promise<MachineMaintenanceResponse> => {
    return fetchItemWithOfflineCache({
        url: `${baseUrl}/${id}`,
        getCached: () => offlineDb.cachedMaintenances.get(id),
        mapToResponse: mapCachedToMaintenanceResponse,
        mapToCache: mapResponseToCache,
        saveToCache: (item) => offlineDb.cachedMaintenances.put(item)
    });
};

export const getMaintenancesByMachineId = async (machineId: string): Promise<MachineMaintenanceResponse[]> => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedMaintenances.where("machineId").equals(machineId).toArray();
        return cached.map(mapCachedToMaintenanceResponse);
    }
    try {
        const response = await apiFetch<MachineMaintenanceResponse[]>(`${baseUrl}/machine/${machineId}`);
        if (Array.isArray(response)) {
            await offlineDb.cachedMaintenances.bulkPut(response.map(mapResponseToCache));
        }
        return response;
    } catch {
        const cached = await offlineDb.cachedMaintenances.where("machineId").equals(machineId).toArray();
        return cached.map(mapCachedToMaintenanceResponse);
    }
};

export const getMaintenanceByTechnicianId = async (technicianId: string): Promise<MachineMaintenanceResponse[]> => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedMaintenances.where("technicianId").equals(technicianId).toArray();
        return cached.map(mapCachedToMaintenanceResponse);
    }
    return apiFetch(`${baseUrl}/technician/${technicianId}`);
};

export const getMaintenancesByStatus = async (status: MaintenanceStatus): Promise<MachineMaintenanceResponse[]> => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedMaintenances.where("status").equals(status).toArray();
        return cached.map(mapCachedToMaintenanceResponse);
    }
    return apiFetch(`${baseUrl}/status/${status}`);
};

export const createMaintenance = async (request: MachineMaintenanceCreateRequest): Promise<MachineMaintenanceResponse> => {
    return mutateWithOfflineQueue<MachineMaintenanceResponse>({
        url: baseUrl,
        method: "POST",
        payload: request,
        entityName: `Karbantartás felvétele: ${request.title}`,
        applyOptimistic: async () => {
            const cachedMachine = await offlineDb.cachedMachines.get(request.machineId);
            const newRecord: CachedMaintenance = {
                id: crypto.randomUUID(),
                machineId: request.machineId,
                machineCode: cachedMachine?.code || "MCH",
                machineName: cachedMachine?.name || "Gép",
                title: request.title,
                status: request.status,
                type: request.type,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                technicianId: request.technicianId,
                technicianName: "Technikus",
                description: request.description,
                lastUpdated: Date.now()
            };
            await offlineDb.cachedMaintenances.put(newRecord);
            return mapCachedToMaintenanceResponse(newRecord);
        },
        onSuccess: async (res) => {
            await offlineDb.cachedMaintenances.put(mapResponseToCache(res));
        }
    });
};

export const updateMaintenance = async (id: string, request: MachineMaintenanceUpdateRequest): Promise<MachineMaintenanceResponse> => {
    return mutateWithOfflineQueue<MachineMaintenanceResponse>({
        url: `${baseUrl}/${id}`,
        method: "PATCH",
        payload: request,
        entityName: `Karbantartás módosítása: ${request.title || id}`,
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedMaintenances.get(id);
            const updated: CachedMaintenance = {
                id,
                machineId: existing?.machineId || "",
                machineCode: existing?.machineCode || "",
                machineName: existing?.machineName || "",
                title: request.title ?? existing?.title ?? "Karbantartás",
                status: existing?.status ?? "SCHEDULED",
                type: request.type ?? existing?.type ?? "PREVENTIVE",
                createdAt: existing?.createdAt ?? new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                technicianId: request.technicianId ?? existing?.technicianId,
                technicianName: existing?.technicianName,
                description: request.description ?? existing?.description,
                rootCause: request.rootCause ?? existing?.rootCause,
                actionTaken: request.actionTaken ?? existing?.actionTaken,
                downtimeMinutes: request.downtimeMinutes ?? existing?.downtimeMinutes,
                cost: request.cost ?? existing?.cost,
                start: request.start ?? existing?.start,
                end: request.end ?? existing?.end,
                lastUpdated: Date.now()
            };
            await offlineDb.cachedMaintenances.put(updated);
            return mapCachedToMaintenanceResponse(updated);
        },
        onSuccess: async (res) => {
            await offlineDb.cachedMaintenances.put(mapResponseToCache(res));
        }
    });
};

export const updateMaintenanceStatus = async (id: string, request: MachineMaintenanceUpdateStatusRequest): Promise<MachineMaintenanceResponse> => {
    return mutateWithOfflineQueue<MachineMaintenanceResponse>({
        url: `${baseUrl}/${id}/status`,
        method: "PATCH",
        payload: request,
        actionType: "STATUS_UPDATE",
        entityName: `Karbantartás státuszváltás: ${request.status}`,
        applyOptimistic: async () => {
            await offlineDb.cachedMaintenances.update(id, { status: request.status, lastUpdated: Date.now() });
            const existing = await offlineDb.cachedMaintenances.get(id);
            if (existing) return mapCachedToMaintenanceResponse(existing);
            return { id, status: request.status } as unknown as MachineMaintenanceResponse;
        },
        onSuccess: async () => {
            await offlineDb.cachedMaintenances.update(id, { status: request.status, lastUpdated: Date.now() });
        }
    });
};

export const deleteMaintenance = async (id: string): Promise<void> => {
    await mutateWithOfflineQueue<void>({
        url: `${baseUrl}/${id}`,
        method: "DELETE",
        payload: null,
        entityName: "Karbantartás törlése",
        applyOptimistic: async () => {
            await offlineDb.cachedMaintenances.delete(id);
        }
    });
};
