import { useMemo } from "react"
import { FileText, RefreshCw } from "lucide-react"
import type { auditTableProps } from "../../../types/component/audit/auditTableProps"
import { Badge } from "../../common/Badge"
import { Card } from "../../common/Card"
import { EmptyState } from "../../common/EmptyState"

const ACTION_CONFIG: Record<
    string,
    { label: string; variant: "skyblue" | "purple" | "teal" | "orange" | "vermillon" | "neutral" }
> = {
    TOGGLE_FEATURE: { label: "Funkció Kapcsolás", variant: "skyblue" },
    SETUP_WIZARD: { label: "Rendszer Inicializálás", variant: "purple" },
    UPDATE_RATE_LIMIT: { label: "Rate Limit Módosítás", variant: "teal" },
    UPDATE_HPA: { label: "HPA Skálázás", variant: "orange" },
    UPDATE_VPA: { label: "VPA Skálázás", variant: "orange" },
    TRIGGER_BACKUP: { label: "Mentés Indítás", variant: "teal" },
    TRIGGER_RESTORE: { label: "Helyreállítás", variant: "vermillon" }
}

export const AuditTable = ({ logs, loading, searchQuery }: auditTableProps) => {
    const filteredLogs = useMemo(() => {
        if (!searchQuery) {
            return logs
        }
        const query = searchQuery.toLowerCase()
        return logs.filter(
            (log) =>
                log.action.toLowerCase().includes(query) ||
                log.details.toLowerCase().includes(query) ||
                log.id.toLowerCase().includes(query)
        )
    }, [logs, searchQuery])

    const getActionBadge = (action: string) => {
        const config = ACTION_CONFIG[action] ?? { label: action, variant: "neutral" as const }
        return <Badge variant={config.variant} text={config.label} size="sm" />
    }

    return (
        <Card hoverEffect={false} className="p-0 overflow-hidden border border-slate-800">
            {loading && (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-cud-skyblue mb-3" />
                    <p className="text-sm font-medium">Audit naplók lekérése...</p>
                </div>
            )}

            {!loading && filteredLogs.length === 0 && (
                <div className="p-6">
                    <EmptyState
                        icon={<FileText className="w-8 h-8 text-slate-500" />}
                        title="Nincs megjeleníthető audit bejegyzés"
                        description={
                            searchQuery
                                ? `Nem található esemény a(z) "${searchQuery}" keresőkifejezésre.`
                                : "Jelenleg nincsenek rögzített biztonsági naplóbejegyzések."
                        }
                    />
                </div>
            )}

            {!loading && filteredLogs.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th className="py-3.5 px-4">Időpont</th>
                                <th className="py-3.5 px-4">Esemény</th>
                                <th className="py-3.5 px-4">Részletek</th>
                                <th className="py-3.5 px-4">Állapot</th>
                                <th className="py-3.5 px-4">Azonosító</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="transition-colors duration-150 hover:bg-slate-800/40"
                                >
                                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                                        {new Date(log.createdAt).toLocaleString("hu-HU")}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        {getActionBadge(log.action)}
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-200 text-sm leading-relaxed">
                                        {log.details}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        <Badge
                                            variant={log.status === "SUCCESS" ? "teal" : "vermillon"}
                                            text={log.status === "SUCCESS" ? "Sikeres" : "Sikertelen"}
                                            pulse={log.status === "SUCCESS"}
                                            size="sm"
                                        />
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                                        <span title={log.id}>
                                            {log.id.slice(0, 8)}...
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    )
}