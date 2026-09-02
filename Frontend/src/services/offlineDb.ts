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

    public saveOfflineAction = async (endpoint: string, method: string, body: any, type: OfflineAction['type'] = "STATUS_UPDATE") => {
        const action: OfflineAction = {
            endpoint,
            method: method as "POST" | "PUT" | "PATCH" | "DELETE",
            payload: body,
            status: "PENDING",
            retryCount: 0,
            timestamp: Date.now(),
            uuid: crypto.randomUUID(),
            type
        }
        await this.offlineQueue.add(action)
    }
}

export const offlineDb = new MesOfflineDatabase();