import { useEffect, useState, useCallback, useMemo } from "react"
import type { BackupHistoryResponseDto, BackupResponseDto } from "../types/backup"
import type { ToastMessage } from "../types/component/common"
import { BackupApi } from "../client/api/backup"

export const useBackupHistory = () => {
    const [history, setHistory] = useState<BackupHistoryResponseDto | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isTriggeringBackup, setIsTriggeringBackup] = useState<boolean>(false)
    const [isRestoring, setIsRestoring] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [selectedRestore, setSelectedRestore] = useState<BackupResponseDto | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const backupApi = useMemo(() => new BackupApi(), [])

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type })
        setTimeout(() => setToastMessage(null), 4000)
    }, [])

    const loadBackups = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await backupApi.getHistory()
            setHistory(res)
            setLastUpdate(new Date())
        } catch {
            showToast("Hiba történt a mentési archívumok lekérése során", "error")
        } finally {
            setIsLoading(false)
        }
    }, [backupApi, showToast])

    useEffect(() => {
        loadBackups()
    }, [loadBackups])

    const handleTriggerBackup = async () => {
        setIsTriggeringBackup(true)
        try {
            const res = await backupApi.triggerBackup()
            showToast(`A mentési K8s Job sikeresen elindult: ${res.jobName}`, "success")
            setTimeout(() => {
                loadBackups()
            }, 3000)
        } catch {
            showToast("Hiba történt a mentés elindítása közben", "error")
        } finally {
            setIsTriggeringBackup(false)
        }
    }

    const handleOpenRestore = (backup: BackupResponseDto) => {
        setSelectedRestore(backup)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedRestore(null)
    }

    const handleConfirmRestore = async () => {
        if (!selectedRestore) return
        setIsRestoring(true)
        try {
            const res = await backupApi.triggerRestore(selectedRestore.filename)
            showToast(`A visszaállítási Job elindult: ${res.jobName}`, "success")
            setTimeout(() => {
                loadBackups()
            }, 3000)
        } catch {
            showToast("Hiba történt a visszaállítás elindítása közben", "error")
        } finally {
            setIsRestoring(false)
            handleCloseModal()
        }
    }

    const syncedCount = useMemo(() => {
        return history?.backups.filter((b) => b.status === "SYNCED").length ?? 0
    }, [history])

    return {
        history,
        isLoading,
        isTriggeringBackup,
        isRestoring,
        searchQuery,
        setSearchQuery,
        selectedRestore,
        isModalOpen,
        toastMessage,
        setToastMessage,
        lastUpdate,
        syncedCount,
        loadBackups,
        handleTriggerBackup,
        handleOpenRestore,
        handleCloseModal,
        handleConfirmRestore
    }
}
