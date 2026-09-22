import { useEffect, useMemo, useState } from "react"
import { RefreshCw, ShieldAlert } from "lucide-react"
import type { AuditResponseDto } from "../types/audit"
import { AuditApi } from "../client/api/audit"
import { AuditStats } from "../components/dashboard/audit/AuditStats"
import { AuditTable } from "../components/dashboard/audit/AuditTable"
import { SearchInput } from "../components/common/SearchInput"
import { Button } from "../components/common/Button"

const STATUS_TABS: { id: "ALL" | "SUCCESS" | "FAILED"; label: string }[] = [
    { id: "ALL", label: "Összes" },
    { id: "SUCCESS", label: "Sikeres" },
    { id: "FAILED", label: "Sikertelen" }
]

export const AuditTab = () => {
    const [logs, setLogs] = useState<AuditResponseDto[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL")
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const loadAuditLogs = async () => {
        setIsLoading(true)
        try {
            const response = await new AuditApi().getLogs(100)
            setLogs(response)
            setLastUpdate(new Date())
        } catch (error) {
            console.error("Nem sikerült lekérni az audit naplókat:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadAuditLogs()
    }, [])

    const filteredByStatus = useMemo(() => {
        if (statusFilter === "ALL") {
            return logs
        }
        return logs.filter((log) => log.status === statusFilter)
    }, [logs, statusFilter])

    const successCount = useMemo(() => {
        return logs.filter((l) => l.status === "SUCCESS").length
    }, [logs])

    const failedCount = useMemo(() => {
        return logs.filter((l) => l.status === "FAILED").length
    }, [logs])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <ShieldAlert className="w-6 h-6 text-cud-purple" />
                        Audit és Biztonsági Naplók
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Rendszerkonfigurációs módosítások, biztonsági események és műveletek visszakövetése.
                        {lastUpdate && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {lastUpdate.toLocaleTimeString("hu-HU")})
                            </span>
                        )}
                    </p>
                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    loading={isLoading}
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={loadAuditLogs}
                >
                    Naplók frissítése
                </Button>
            </div>

            <AuditStats
                totalLogs={logs.length}
                successCount={successCount}
                failedCount={failedCount}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Keresés művelet, részlet vagy ID alapján..."
                    className="w-full sm:w-80"
                />

                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                    {STATUS_TABS.map((tab) => {
                        const isSelected = statusFilter === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id)}
                                className={`w-full sm:w-32 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200 cursor-pointer ${
                                    isSelected
                                        ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                                        : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                            >
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <AuditTable
                logs={filteredByStatus}
                loading={isLoading}
                searchQuery={searchQuery}
            />
        </div>
    )
}
