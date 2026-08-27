import { useMemo } from "react";
import type { MaintenanceStatsCardProps } from "../../types/maintenance/MaintenanceProps";
import { Calendar, CheckCircle2, Hourglass, Wrench } from "lucide-react";

export const StatsCard = ({ maintenances }: MaintenanceStatsCardProps) => {

    const stats = useMemo(() => {
        const total: number = maintenances.length;
        const scheduled: number = maintenances.filter(m => m.status === "SCHEDULED").length;
        const inProgress: number = maintenances.filter(m => m.status === "IN_PROGRESS").length;
        const completed: number = maintenances.filter(m => m.status === "COMPLETED").length;

        return { total, scheduled, inProgress, completed }
    }, [maintenances])

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tervezett</span>
                    <h3 className="text-2xl font-extrabold text-blue-400">{stats.scheduled} <span className="text-xs text-slate-500 font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Calendar size={22} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Folyamatban</span>
                    <h3 className="text-2xl font-extrabold text-amber-400">{stats.inProgress} <span className="text-xs text-slate-500 font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Hourglass size={22} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teljesítve</span>
                    <h3 className="text-2xl font-extrabold text-emerald-400">{stats.completed} <span className="text-xs text-slate-500 font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={22} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Összesen</span>
                    <h3 className="text-2xl font-extrabold text-rose-400">{stats.total} <span className="text-xs text-slate-500 font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <Wrench size={22} />
                </div>
            </div>
        </div>
    )
}