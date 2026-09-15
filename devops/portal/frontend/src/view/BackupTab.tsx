import { useEffect, useState } from "react"
import type { BackupHistoryResponseDto, BackupResponseDto } from "../types/backup"
import { BackupTable } from "../components/dashboard/backup/Table"
import { Button } from "../components/common/Button"
import { Archive, CheckCircle2, AlertCircle, Play, RefreshCw, X } from "lucide-react"
import { BackupStats } from "../components/dashboard/backup/Stats"
import { SearchInput } from "../components/common/SearchInput"
import { RestoreModal } from "../components/dashboard/backup/RestoreModal"
import { BackupApi } from "../client/api/backup"

interface FeedbackMessage {
    text: string
    type?: "success" | "error"
}

export const BackupTab = () => {
    const [history, setHistory] = useState<BackupHistoryResponseDto>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isTriggeringBackup, setIsTriggeringBackup] = useState<boolean>(false)
    const [isRestoring, setIsRestoring] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [selectedRestore, setSelectedRestore] = useState<BackupResponseDto | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [feedbackMessage, setFeedBackMessage] = useState<FeedbackMessage | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const syncedCount = history?.backups.filter((backup) => backup.status === "SYNCED").length ?? 0

    const handleLoadBackups = async () => {
        setIsLoading(true)
        try {
            const res = await new BackupApi().getHistory()
            setHistory(res)
            setLastUpdate(new Date())
        } catch (err) {
            setFeedBackMessage({
                text: "Hiba történt a mentési archívumok lekérése során",
                type: "error"
            })
            setTimeout(() => setFeedBackMessage(null), 5000)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        handleLoadBackups()
    }, [])

    const handleTriggerBackup = async () => {
        setIsTriggeringBackup(true)
        try {
            const res = await new BackupApi().triggerBackup()
            setFeedBackMessage({
                text: `A mentési K8s Job sikeresen elindult: ${res.jobName} (${res.message})`,
                type: "success"
            })
            setTimeout(() => {
                setFeedBackMessage(null)
                handleLoadBackups()
            }, 3000)
        } catch (err) {
            setFeedBackMessage({
                text: "Hiba történt a mentés elindítása közben",
                type: "error"
            })
            setTimeout(() => setFeedBackMessage(null), 5000)
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
            const res = await new BackupApi().triggerRestore(selectedRestore.filename)
            setFeedBackMessage({
                text: `A visszaállítási Job elindult: ${res.jobName}`,
                type: "success"
            })
            setTimeout(() => {
                setFeedBackMessage(null)
                handleLoadBackups()
            }, 3000)
        } catch (err) {
            setFeedBackMessage({
                text: "Hiba történt a visszaállítás elindítása közben",
                type: "error"
            })
            setTimeout(() => setFeedBackMessage(null), 5000)
        } finally {
            setIsRestoring(false)
            handleCloseModal()
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <Archive className="w-6 h-6 text-cud-teal" />
                        Biztonsági Mentések és Katasztrófa-helyreállítás
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Automatizált K8s állapotmentések, S3/MinIO tárolás és adatbázis visszaállítás.
                        {lastUpdate && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {lastUpdate.toLocaleTimeString("hu-HU")})
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isLoading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={handleLoadBackups}
                    >
                        Frissítés
                    </Button>

                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Play className="w-4 h-4 fill-current" />}
                        loading={isTriggeringBackup}
                        onClick={handleTriggerBackup}
                    >
                        Azonnali Mentés Indítása
                    </Button>
                </div>
            </div>

            {feedbackMessage && (
                <div
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${feedbackMessage.type === "error"
                        ? "bg-cud-vermillon-bg text-cud-vermillon border-cud-vermillon-border"
                        : "bg-cud-teal-bg text-cud-teal border-cud-teal-border"
                        }`}
                >
                    <div className="flex items-center gap-2.5 text-sm font-medium">
                        {feedbackMessage.type === "error" ? (
                            <AlertCircle className="w-5 h-5 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                        )}
                        <span>{feedbackMessage.text}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedBackMessage(null)}
                        className="opacity-70 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        aria-label="Értesítés bezárása"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <BackupStats
                totalCount={history?.totalCount ?? 0}
                latestBackup={history?.latestBackup}
                syncedCount={syncedCount}
            />

            <div className="flex items-center justify-between">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Mentési archívum keresése név alapján..."
                    className="w-full sm:w-80"
                />
            </div>

            <BackupTable
                backups={history?.backups || []}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onSelectRestore={handleOpenRestore}
            />

            <RestoreModal
                isOpen={isModalOpen}
                backup={selectedRestore}
                isLoading={isRestoring}
                onConfirm={handleConfirmRestore}
                onClose={handleCloseModal}
            />
        </div>
    )
}