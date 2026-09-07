import { useEffect, useState } from "react"
import { getSyncStatus, subscribeSyncStatus, syncOfflineQueue } from "../services/syncEngine"
import type { SyncStatus } from "../types/offline/offline"

export const useSyncStatus = () => {

    const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

    useEffect(() => {
        const update = (status: SyncStatus) => setSyncStatus(status);
        const unsub = subscribeSyncStatus(update);
        return unsub;
    }, [])

    return {
        total: syncStatus.total,
        current: syncStatus.current,
        isSyncing: syncStatus.isSyncing,
        conflictCount: syncStatus.conflictCount,
        syncNow: syncOfflineQueue,
    }
}