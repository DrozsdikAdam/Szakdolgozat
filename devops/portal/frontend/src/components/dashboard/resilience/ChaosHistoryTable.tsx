import type { ChaosHistoryTableProps } from "../../../types/component/resilience"
import type { KillPodResult } from "../../../types/resilience"
import { Card } from "../../common/Card"
import { Badge } from "../../common/Badge"
import { EmptyState } from "../../common/EmptyState"
import { Skeleton } from "../../common/Skeleton"
import { CHAOS_STATUS_CONFIG, formatResilienceDate } from "../../../constants/resilience"

const renderSkeleton = () => (
    <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-20" />
            </div>
        ))}
    </div>
)

const renderEmptyState = () => (
    <EmptyState
        title="Nincsenek káosz kísérlet előzmények"
        description="Indíts el egy pod leállítást a fenti kártyán az öngyógyulási idő (RTO) méréséhez."
    />
)

const renderRecoveryTime = (recoveryTimeSeconds: number | undefined) => {
    if (typeof recoveryTimeSeconds !== "number") {
        return <span className="text-slate-500">-</span>
    }

    return (
        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {recoveryTimeSeconds} mp
        </span>
    )
}

export const ChaosHistoryTable = ({ experiments, isLoading = false }: ChaosHistoryTableProps) => {
    const renderTableRow = (item: KillPodResult) => {

        const statusConfig = CHAOS_STATUS_CONFIG[item.status] || CHAOS_STATUS_CONFIG.PENDING

        return (
            <tr key={item.experimentId} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-400">{item.experimentId}</td>
                <td className="px-4 py-3 text-slate-100">{item.podName}</td>
                <td className="px-4 py-3 font-sans text-slate-400">{item.namespace}</td>
                <td className="px-4 py-3 text-slate-400">{formatResilienceDate(item.killedAt)}</td>
                <td className="px-4 py-3">{renderRecoveryTime(item.recoveryTimeSeconds)}</td>
                <td className="px-4 py-3 text-right font-sans">
                    <Badge
                        variant={statusConfig.variant}
                        text={statusConfig.text}
                        pulse={statusConfig.pulse}
                        size="sm"
                    />
                </td>
            </tr>
        )
    }

    const renderTableContent = () => {
        if (isLoading) {
            return renderSkeleton()
        }

        if (experiments.length === 0) {
            return renderEmptyState()
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="px-4 py-3">Kísérlet ID</th>
                            <th className="px-4 py-3">Pod Név</th>
                            <th className="px-4 py-3">Névtér</th>
                            <th className="px-4 py-3">Kilövés Ideje</th>
                            <th className="px-4 py-3">Mért RTO</th>
                            <th className="px-4 py-3 text-right">Státusz</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                        {experiments.map(renderTableRow)}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <Card hoverEffect={false} className="border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-4">
            <div>
                <h3 className="text-lg font-bold text-slate-100">Káosz Kísérlet Előzmények & RTO</h3>
                <p className="text-xs text-slate-400">Leállított podok öngyógyulási sebessége és visszaállási statisztikái</p>
            </div>

            {renderTableContent()}
        </Card>
    )
}

