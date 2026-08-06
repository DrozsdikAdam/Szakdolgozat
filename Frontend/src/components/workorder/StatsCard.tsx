import { useMemo } from "react"
import type { WorkOrderStatsCardProps } from "../../types/workorder/workOrderProps"
import { AlertTriangle, Calendar, CheckCircle2, Hourglass } from "lucide-react"

export const WorkOrderStatsCard = ({ orders }: WorkOrderStatsCardProps) => {
    const stats = useMemo(() => {
        let planned = 0
        let inProgress = 0
        let completed = 0
        let totalProduced = 0
        let totalScrap = 0

        orders.forEach((order) => {
            if (order.status === "PLANNED" || order.status === "PREPARED") planned++
            if (order.status === "IN_PROGRESS" || order.status === "QUALITY_CHECK") inProgress++
            if (order.status === "COMPLETED") completed++
            if (order.producedQuantity > 0) totalProduced += order.producedQuantity
            if (order.scrapQuantity > 0) totalScrap += order.scrapQuantity
        })

        const totalItems = totalProduced + totalScrap
        const scrapPercentage = totalItems > 0 ? (totalScrap / totalItems) * 100 : 0

        return {
            planned,
            inProgress,
            completed,
            totalProduced,
            totalScrap,
            scrapPercentage
        }
    }, [orders])

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tervezett</span>
                    <h3 className="text-2xl font-extrabold text-blue-400">{stats.planned} <span className="text-xs text-slate-500 font-normal">db rendelés</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Calendar size={22} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gyártás alatt</span>
                    <h3 className="text-2xl font-extrabold text-amber-400">{stats.inProgress} <span className="text-xs text-slate-500 font-normal">db rendelés</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Hourglass size={22} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teljesítve</span>
                    <h3 className="text-2xl font-extrabold text-emerald-400">{stats.completed} <span className="text-xs text-slate-500 font-normal">({stats.totalProduced} db termék)</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={22} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selejt arány</span>
                    <h3 className="text-2xl font-extrabold text-rose-400">{stats.scrapPercentage.toFixed(2)}% <span className="text-xs text-slate-500 font-normal">({stats.totalScrap} db selejt)</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertTriangle size={22} />
                </div>
            </div>
        </div>
    )
}