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
            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tervezett</span>
                    <h3 className="text-2xl font-extrabold text-cud-skyblue">{stats.planned} <span className="text-xs text-dim font-normal">db rendelés</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-skyblue-bg) border border-(--cud-skyblue-border) text-cud-skyblue">
                    <Calendar size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Gyártás alatt</span>
                    <h3 className="text-2xl font-extrabold text-cud-orange">{stats.inProgress} <span className="text-xs text-dim font-normal">db rendelés</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-orange-bg) border border-(--cud-orange-border) text-cud-orange">
                    <Hourglass size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Teljesítve</span>
                    <h3 className="text-2xl font-extrabold text-cud-teal">{stats.completed} <span className="text-xs text-dim font-normal">({stats.totalProduced} db termék)</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-teal-bg) border border-(--cud-teal-border) text-cud-teal">
                    <CheckCircle2 size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Selejt arány</span>
                    <h3 className="text-2xl font-extrabold text-cud-vermillon">{stats.scrapPercentage.toFixed(2)}% <span className="text-xs text-dim font-normal">({stats.totalScrap} db selejt)</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border) text-cud-vermillon">
                    <AlertTriangle size={22} />
                </div>
            </div>
        </div>
    )
}