import { Box, CheckCircle2, AlertTriangle } from "lucide-react"
import { StatCard } from "../../common/StatCard"
import type { ClusterStatsProps } from "../../../types/component/cluster/clusterStatsProps"

export const ClusterStats = ({ totalPods, runningPods, totalRestarts }: ClusterStatsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                title="Összes Pod"
                value={totalPods}
                icon={<Box className="w-5 h-5" />}
                iconBoxClassName="bg-slate-800/80 text-cud-skyblue border border-slate-700/60"
            />

            <StatCard
                title="Aktív / Futó Podok"
                value={`${runningPods} / ${totalPods}`}
                valueClassName="text-cud-teal"
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
            />

            <StatCard
                title="Újraindítások száma"
                value={totalRestarts}
                valueClassName={totalRestarts > 0 ? "text-cud-orange" : "text-slate-100"}
                icon={<AlertTriangle className="w-5 h-5" />}
                iconBoxClassName={
                    totalRestarts > 0
                        ? "bg-cud-orange-bg text-cud-orange border border-cud-orange-border"
                        : "bg-slate-800/80 text-slate-400 border border-slate-700/60"
                }
            />
        </div>
    )
}
