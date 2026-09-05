import { useMemo } from "react"
import type { MachineStatsCardProps } from "../../types/machine/MachineProps"
import { Activity, AlertTriangle, Cpu, Hourglass } from "lucide-react";

export const MachineStatsCard = ({ machines }: MachineStatsCardProps) => {

    const stats = useMemo(() => {
        const total = machines.length;
        const running = machines.filter(m => m.status === "RUNNING").length;
        const idle = machines.filter(m => m.status === "IDLE").length;
        const maintenanceOrError = machines.filter(m => m.status === "MAINTENANCE" || m.status === "ERROR").length;

        return { total, running, idle, maintenanceOrError }
    }, [machines])

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Összes Gép</span>
                    <h3 className="text-2xl font-extrabold text-cud-skyblue">{stats.total} db</h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-skyblue-bg) border border-(--cud-skyblue-border) text-cud-skyblue">
                    <Cpu size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Készenlétben</span>
                    <h3 className="text-2xl font-extrabold text-cud-yellow">{stats.idle} db </h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-yellow-bg) border border-(--cud-yellow-border) text-cud-yellow">
                    <Activity size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Termelésben</span>
                    <h3 className="text-2xl font-extrabold text-cud-teal">{stats.running} db </h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-teal-bg) border border-(--cud-teal-border) text-cud-teal">
                    <Hourglass size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Karbantartás / Hiba</span>
                    <h3 className="text-2xl font-extrabold text-cud-vermillon">{stats.maintenanceOrError} db </h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border) text-cud-vermillon">
                    <AlertTriangle size={22} />
                </div>
            </div>
        </div>
    )
}