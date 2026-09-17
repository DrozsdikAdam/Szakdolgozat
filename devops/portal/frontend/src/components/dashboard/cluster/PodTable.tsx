import { Box, RefreshCw } from "lucide-react"
import type { PodTableProps } from "../../../types/component/cluster/podTableProps"
import { Badge } from "../../common/Badge"
import { Card } from "../../common/Card"
import { EmptyState } from "../../common/EmptyState"

export const PodTable = ({ pods, loading, searchQuery }: PodTableProps) => {
    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        if (s === "running") {
            return <Badge variant="teal" text="Fut (Running)" pulse={true} size="sm" />
        }

        if (s === "succeeded" || s === "completed" || s === "success") {
            return <Badge variant="teal" text="Sikeres (Succeeded)" pulse={false} size="sm" />
        }

        if (s.includes("pending") || s.includes("creating") || s.includes("init")) {
            return <Badge variant="orange" text={status} pulse={true} size="sm" />
        }
        return <Badge variant="vermillon" text={status} pulse={false} size="sm" />
    }

    return (
        <Card hoverEffect={false} className="p-0 overflow-hidden border border-slate-800">
            {loading && (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-cud-skyblue mb-3" />
                    <p className="text-sm font-medium">Klaszter állapotának lekérése...</p>
                </div>
            )}

            {!loading && pods.length === 0 && (
                <div className="p-6">
                    <EmptyState
                        icon={<Box className="w-8 h-8" />}
                        title="Nincs megjeleníthető pod"
                        description={
                            searchQuery
                                ? "A megadott keresési feltételre nem található pod ebben a nézetben."
                                : "Jelenleg nem futnak podok a kiválasztott névtérben."
                        }
                    />
                </div>
            )}

            {!loading && pods.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th className="py-3.5 px-4">Pod Név</th>
                                <th className="py-3.5 px-4">Készültség</th>
                                <th className="py-3.5 px-4">Státusz</th>
                                <th className="py-3.5 px-4">Újraindítás</th>
                                <th className="py-3.5 px-4">Életkor</th>
                                <th className="py-3.5 px-4">Névtér</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {pods.map((pod) => (
                                <tr
                                    key={pod.name}
                                    className="transition-colors duration-150 hover:bg-slate-800/40"
                                >
                                    <td className="py-3.5 px-4 font-mono text-xs text-slate-200 font-medium flex items-center gap-2">
                                        <Box className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span className="truncate max-w-xs sm:max-w-md" title={pod.name}>
                                            {pod.name}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                                        {pod.ready}
                                    </td>
                                    <td className="py-3.5 px-4">{getStatusBadge(pod.status)}</td>
                                    <td className="py-3.5 px-4 font-mono text-xs">
                                        {pod.restarts > 0 ? (
                                            <Badge
                                                variant="orange"
                                                text={`${pod.restarts}x`}
                                                size="sm"
                                            />
                                        ) : (
                                            <span className="text-slate-500">0</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-slate-400">{pod.age}</td>
                                    <td className="py-3.5 px-4">
                                        <span
                                            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${pod.namespace === "app-mes" || pod.source === "app"
                                                ? "bg-cud-skyblue-bg text-cud-skyblue border border-cud-skyblue-border"
                                                : "bg-slate-800/90 text-slate-300 border border-slate-700/80"
                                                }`}
                                        >
                                            {pod.namespace || (pod.source === "app" ? "app-mes" : "platform-infra")}
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
