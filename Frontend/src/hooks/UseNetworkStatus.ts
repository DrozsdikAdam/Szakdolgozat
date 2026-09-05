import { useEffect, useState } from "react"
import { offlineDb } from "../services/offlineDb"

export const useNetworkStatus = () => {

    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
    const [pendingCount, setPendingCount] = useState<number>(0)

    const refreshPendingCount = async () => {
        const count = await offlineDb.offlineQueue.where('status').equals('PENDING').count()
        setPendingCount(count)
    }

    useEffect(() => {
        refreshPendingCount()
        const interval = setInterval(refreshPendingCount, 2000)

        const handleOnline = () => { setIsOnline(true); refreshPendingCount(); }
        const handleOffline = () => { setIsOnline(false); refreshPendingCount(); }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            clearInterval(interval)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return {
        isOnline,
        pendingCount,
        refreshPendingCount
    }
}