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
                    <h3 className="text-2xl font-extrabold text-blue-400">{stats.total} db</h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Cpu size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Készenlétben</span>
                    <h3 className="text-2xl font-extrabold text-amber-400">{stats.idle} db </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Activity size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Termelésben</span>
                    <h3 className="text-2xl font-extrabold text-emerald-400">{stats.running} db </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Hourglass size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Karbantartás / Hiba</span>
                    <h3 className="text-2xl font-extrabold text-rose-400">{stats.maintenanceOrError} db </h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertTriangle size={22} />
                </div>
            </div>
        </div>
    )
}