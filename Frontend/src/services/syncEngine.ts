import { offlineDb } from "./offlineDb";
import { apiFetch } from "../utils/apiFetch";
import type { OfflineAction, SyncStatus } from "../types/offline/offline";

let state: SyncStatus = {
    isSyncing: false,
    total: 0,
    current: 0,
    conflictCount: 0
};

const listeners: ((status: SyncStatus) => void)[] = [];

export const getSyncStatus = () => ({ ...state })

export const subscribeSyncStatus = (callback: (status: SyncStatus) => void) => {
    callback(getSyncStatus());
    listeners.push(callback);
    return () => { listeners.splice(listeners.indexOf(callback), 1) };
}

export const notifySyncStatusChange = (status: SyncStatus) => {
    listeners.forEach(listener => listener(status));
}

export const syncOfflineQueue = async () => {
    if (!navigator.onLine || state.isSyncing)
        return;

    try {
        const pendingActions: OfflineAction[] = await offlineDb.getPendingActions();
        const conflictedActions: OfflineAction[] = await offlineDb.getConflictedActions();
        state.conflictCount = conflictedActions.length;

        if (pendingActions.length === 0) {
            state.total = 0;
            state.current = 0;
            notifySyncStatusChange(state);
            return;
        }

        state.isSyncing = true;
        state.total = pendingActions.length;
        state.current = 0;
        notifySyncStatusChange(state);

        for (const action of pendingActions) {
            state.current++;
            notifySyncStatusChange(state);

            try {
                await apiFetch(action.endpoint, {
                    method: action.method,
                    body: action.payload ? JSON.stringify(action.payload) : undefined,
                });
                await offlineDb.removeAction(action.id!);
            } catch (error) {
                if (!navigator.onLine)
                    break;

                await offlineDb.markActionAsConflict(
                    action.id!,
                    error instanceof Error ? error.message : "Ismeretlen hiba"
                );
                state.conflictCount++;
                notifySyncStatusChange(state);
            }
        }
    } catch (err) {
        console.error("Szinkronizációs hiba:", err);
    } finally {
        state.isSyncing = false;
        notifySyncStatusChange(state);
    }
};

export const getPendingActions = async (): Promise<OfflineAction[]> => {
    return await offlineDb.getPendingActions();
};

export const getConflictedActions = async () => {
    return await offlineDb.getConflictedActions();
};

export const discardConflict = async (id?: number) => {
    if (!id) return;
    await offlineDb.removeAction(id);
    state.conflictCount = Math.max(0, state.conflictCount - 1)
    notifySyncStatusChange(state);
}

export const resolveConflictWithPayload = async (actionId: number, newPayload: any) => {
    await offlineDb.updateActionPayload(actionId, newPayload);
    await syncOfflineQueue();
}

export const retryConflict = async (actionId: number) => {
    const action = await offlineDb.offlineQueue.get(actionId);
    if (!action) return;

    await offlineDb.updateActionPayload(actionId, action.payload);
    await syncOfflineQueue();
}

window.addEventListener('online', () => { syncOfflineQueue(); });