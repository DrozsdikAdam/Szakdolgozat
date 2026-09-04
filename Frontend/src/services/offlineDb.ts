import { Dexie } from "dexie"
import type { Table } from "dexie"
import type { OfflineAction, CachedWorkOrder } from '../types/offline/offline';

class MesOfflineDatabase extends Dexie {
    offlineQueue!: Table<OfflineAction, number>;
    cachedWorkOrders!: Table<CachedWorkOrder, string>;

    constructor() {
        super("MesOfflineDatabase");
        this.version(1).stores({
            offlineQueue: '++id, uuid, type, status, timestamp',
            cachedWorkOrders: 'id, orderNumber, status, assignedUserId, lastUpdated'
        })
    }

    public saveOfflineAction = async (endpoint: string, method: string, body: any, type: OfflineAction['type'] = "STATUS_UPDATE", entityName: string = "Általános művelet") => {
        const action: OfflineAction = {
            endpoint,
            method: method as "POST" | "PUT" | "PATCH" | "DELETE",
            payload: body,
            status: "PENDING",
            retryCount: 0,
            timestamp: Date.now(),
            uuid: crypto.randomUUID(),
            type,
            entityName
        }
        await this.offlineQueue.add(action)
    }

    public getPendingActions = async () => {
        const actions = await this.offlineQueue.where("status").equals("PENDING").toArray();
        actions.sort((a, b) => a.timestamp - b.timestamp);
        return actions;
    }

    public getConflictedActions = async () => {
        const actions = await this.offlineQueue.where("status").equals("CONFLICT").toArray();
        actions.sort((a, b) => a.timestamp - b.timestamp);
        return actions;
    }

    public markActionAsConflict = async (actionId: number, error: string = "Szerver ütközés", serverConflictData?: any) => {
        await this.offlineQueue.update(actionId, { status: "CONFLICT", error: error, serverConflictData: serverConflictData || {} });
    }

    public removeAction = async (actionId: number) => {
        await this.offlineQueue.delete(actionId);
    }

    public updateActionPayload = async (actionId: number, payload: any) => {
        const status: OfflineAction["status"] = "PENDING";
        await this.offlineQueue.update(actionId, {
            payload,
            status,
            error: undefined,
            serverConflictData: undefined
        });
    }
}

export const offlineDb = new MesOfflineDatabase();