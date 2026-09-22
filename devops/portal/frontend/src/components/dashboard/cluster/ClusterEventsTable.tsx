import { useMemo, useState } from "react"
import { Activity, RefreshCw } from "lucide-react"
import type { ClusterEventsProps } from "../../../types/component/cluster/clusterEventsProps"
import type { SegmentedControlOption } from "../../../types/component/common/segmentedControlProps"
import { Badge } from "../../common/Badge"
import { Card } from "../../common/Card"
import { EmptyState } from "../../common/EmptyState"
import { SearchInput } from "../../common/SearchInput"
import { Button } from "../../common/Button"
import { SegmentedControl } from "../../common/SegmentedControl"

export const ClusterEventsTable = ({ events, loading, onRefresh, searchQuery, onSearchChange }: ClusterEventsProps) => {
    const [typeFilter, setTypeFilter] = useState<"all" | "warning" | "normal">("all")

    const filteredEvents = useMemo(() => {
        return events.filter(evt => {
            const matchesSearch =
                !searchQuery.trim() ||
                evt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                evt.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                evt.involvedObjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                evt.namespace.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesType =
                typeFilter === "all" ||
                (typeFilter === "warning" && evt.type === "Warning") ||
                (typeFilter === "normal" && evt.type === "Normal")

            return matchesSearch && matchesType
        })
    }, [events, searchQuery, typeFilter])

    const warningCount = events.filter(e => e.type === "Warning").length
    const normalCount = events.filter(e => e.type === "Normal").length

    const filterOptions: SegmentedControlOption<"all" | "warning" | "normal">[] = [
        { id: "all", label: "Összes", count: events.length, variant: "skyblue" },
        { id: "normal", label: "Normál", count: normalCount, variant: "teal" },
        { id: "warning", label: "Figyelmeztetés", count: warningCount, variant: "vermillon" }
    ]

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <SearchInput
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Keresés esemény, pod vagy üzenet alapján..."
                    className="w-full sm:w-80"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    <SegmentedControl<"all" | "warning" | "normal">
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={filterOptions}
                        layout="grid"
                    />

                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cud-skyblue" : ""}`} />}
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>

            <Card hoverEffect={false} className="p-0 overflow-hidden border border-slate-800">
                {loading && events.length === 0 && (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-cud-skyblue mb-3" />
                        <p className="text-sm font-medium">Klaszter események lekérése a Kubernetesből...</p>
                    </div>
                )}

                {!loading && filteredEvents.length === 0 && (
                    <div className="p-6">
                        <EmptyState
                            icon={<Activity className="w-8 h-8" />}
                            title="Nincsenek események"
                            description={
                                searchQuery
                                    ? "A megadott keresési feltételre nem található klaszter esemény."
                                    : "Jelenleg nincsenek rögzített események a kiválasztott szűrővel."
                            }
                        />
                    </div>
                )}

                {filteredEvents.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    <th className="py-3.5 px-4">Típus</th>
                                    <th className="py-3.5 px-4">Esemény Oka</th>
                                    <th className="py-3.5 px-4">Érintett Erőforrás</th>
                                    <th className="py-3.5 px-4">Névtér</th>
                                    <th className="py-3.5 px-4">Részletek (Üzenet)</th>
                                    <th className="py-3.5 px-4">Időpont</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-sm">
                                {filteredEvents.map((evt) => (
                                    <tr
                                        key={evt.id}
                                        className="transition-colors duration-150 hover:bg-slate-800/40"
                                    >
                                        <td className="py-3.5 px-4">
                                            <Badge
                                                variant={evt.type === "Warning" ? "vermillon" : "teal"}
                                                text={evt.type}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-200">
                                            {evt.reason}
                                            {evt.count > 1 && (
                                                <span className="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                                    {evt.count}x
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                                            <div className="font-semibold text-slate-100">{evt.involvedObjectName}</div>
                                            <div className="text-[10px] text-slate-500">{evt.involvedObjectKind}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80">
                                                {evt.namespace}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-slate-300 max-w-md">
                                            <p className="line-clamp-2 leading-relaxed" title={evt.message}>
                                                {evt.message}
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                                            {new Date(evt.lastTimestamp).toLocaleTimeString("hu-HU", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit"
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}
