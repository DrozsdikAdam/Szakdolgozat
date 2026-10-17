import { offlineDb } from "./offlineDb";
import { quarantineService } from "./quarantineService";
import type { OfflineAction, SyncStatus } from "../types/offline/offline";
import type { SyncBatchRequestDto, SyncItemDto } from "../types/offline/quarantine";

let state: SyncStatus = {
    isSyncing: false,
    total: 0,
    current: 0,
    conflictCount: 0
};

const listeners: ((status: SyncStatus) => void)[] = [];

export const getSyncStatus = () => ({ ...state });

export const subscribeSyncStatus = (callback: (status: SyncStatus) => void) => {
    callback(getSyncStatus());
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
};

export const notifySyncStatusChange = (status: SyncStatus) => {
    listeners.forEach(listener => listener(status));
};

export const extractEntityId = (endpoint: string, payload: any): string | null => {
    if (payload && typeof payload === "object" && "id" in payload && payload.id) {
        return String(payload.id);
    }

    const uuidMatch = endpoint.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    if (uuidMatch) {
        return uuidMatch[0];
    }

    const segments = endpoint.split("/").filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        if (seg !== "status" && seg !== "resolve" && seg !== "user" && seg !== "product") {
            return seg;
        }
    }
    return null;
};

const normalizeEntityName = (name: string, endpoint: string): string => {
    if (name && name !== "Általános művelet") {
        return name;
    }
    if (endpoint.includes("/work-orders")) return "WorkOrder";
    if (endpoint.includes("/inventory")) return "Inventory";
    if (endpoint.includes("/machines")) return "Machine";
    if (endpoint.includes("/products")) return "Product";
    if (endpoint.includes("/maintenance")) return "Maintenance";
    return name || "Unknown";
};

export const refreshQuarantineCount = async (): Promise<number> => {
    let localCount = 0;
    try {
        const localConflicts = await offlineDb.getConflictedActions();
        localCount = localConflicts.length;
    } catch {
        localCount = 0;
    }

    if (!navigator.onLine) {
        state.conflictCount = localCount;
        notifySyncStatusChange(state);
        return state.conflictCount;
    }

    try {
        const serverCount = await quarantineService.getPendingConflictCount();
        state.conflictCount = Number(serverCount || 0) + localCount;
        notifySyncStatusChange(state);
        return state.conflictCount;
    } catch {
        state.conflictCount = localCount;
        notifySyncStatusChange(state);
        return state.conflictCount;
    }
};

export const syncOfflineQueue = async () => {
    if (!navigator.onLine || state.isSyncing) {
        return;
    }

    try {
        const pendingActions: OfflineAction[] = await offlineDb.getPendingActions();

        if (pendingActions.length === 0) {
            state.total = 0;
            state.current = 0;
            await refreshQuarantineCount();
            notifySyncStatusChange(state);
            return;
        }

        state.isSyncing = true;
        state.total = pendingActions.length;
        state.current = 0;
        notifySyncStatusChange(state);

        const items: SyncItemDto[] = pendingActions.map(action => {
            const entityId = extractEntityId(action.endpoint, action.payload);
            const payloadObj = action.payload as any;
            const clientVersion = payloadObj && typeof payloadObj === "object" && typeof payloadObj.version === "number"
                ? payloadObj.version
                : null;

            return {
                operationId: action.uuid,
                entityName: normalizeEntityName(action.entityName, action.endpoint),
                entityId,
                httpMethod: action.method,
                endpointUrl: action.endpoint,
                payloadJson: action.payload !== undefined && action.payload !== null ? JSON.stringify(action.payload) : undefined,
                clientVersion,
                clientTimestamp: new Date(action.timestamp).toISOString()
            };
        });

        const batchRequest: SyncBatchRequestDto = { items };
        const batchResponse = await quarantineService.processOfflineBatch(batchRequest);

        if (batchResponse?.results) {
            for (const result of batchResponse.results) {
                state.current++;
                notifySyncStatusChange(state);

                const matchingAction = pendingActions.find(a => a.uuid === result.operationId);
                if (!matchingAction || !matchingAction.id) continue;

                if (result.status === 'APPLIED' || result.status === 'SKIPPED') {
                    await offlineDb.removeAction(matchingAction.id);
                } else if (result.status === 'CONFLICT') {
                    await offlineDb.removeAction(matchingAction.id);
                } else if (result.status === 'ERROR') {
                    await offlineDb.markActionAsConflict(
                        matchingAction.id,
                        result.message || "Szerverhiba történt a szinkronizáció során"
                    );
                }
            }
        }

        await refreshQuarantineCount();

    } catch (err) {
        console.error("Kötegelt szinkronizációs hiba:", err);
    } finally {
        state.isSyncing = false;
        notifySyncStatusChange(state);
    }
};

export const getPendingActions = async (): Promise<OfflineAction[]> => {
    return await offlineDb.getPendingActions();
};

export const getConflictedActions = async (): Promise<OfflineAction[]> => {
    return await offlineDb.getConflictedActions();
};

export const discardConflict = async (id?: number) => {
    if (!id) return;
    await offlineDb.removeAction(id);
    state.conflictCount = Math.max(0, state.conflictCount - 1);
    notifySyncStatusChange(state);
};

export const resolveConflictWithPayload = async (actionId: number, newPayload: any) => {
    await offlineDb.updateActionPayload(actionId, newPayload);
    await syncOfflineQueue();
};

export const retryConflict = async (actionId: number) => {
    const action = await offlineDb.offlineQueue.get(actionId);
    if (!action) return;

    await offlineDb.updateActionPayload(actionId, action.payload);
    await syncOfflineQueue();
};

window.addEventListener('online', () => {
    syncOfflineQueue();
});