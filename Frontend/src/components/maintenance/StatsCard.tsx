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
            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tervezett</span>
                    <h3 className="text-2xl font-extrabold text-cud-yellow">{stats.scheduled} <span className="text-xs text-dim font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-yellow-bg) border border-(--cud-yellow-border) text-cud-yellow">
                    <Calendar size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Folyamatban</span>
                    <h3 className="text-2xl font-extrabold text-cud-orange">{stats.inProgress} <span className="text-xs text-dim font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-orange-bg) border border-(--cud-orange-border) text-cud-orange">
                    <Hourglass size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Teljesítve</span>
                    <h3 className="text-2xl font-extrabold text-cud-teal">{stats.completed} <span className="text-xs text-dim font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-teal-bg) border border-(--cud-teal-border) text-cud-teal">
                    <CheckCircle2 size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Összesen</span>
                    <h3 className="text-2xl font-extrabold text-cud-skyblue">{stats.total} <span className="text-xs text-dim font-normal">db</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-skyblue-bg) border border-(--cud-skyblue-border) text-cud-skyblue">
                    <Wrench size={22} />
                </div>
            </div>
        </div>
    )
}