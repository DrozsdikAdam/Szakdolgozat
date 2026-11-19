import { Database, Zap, Layers, Cpu, ShieldCheck } from "lucide-react";
import type { DatabaseMetricCardsProps } from "../../../types/component/database/databaseMetricCardsProps";
import { Badge } from "../../common/Badge";
import { Skeleton } from "../../common/Skeleton";
import { DATABASE_STATUS_BADGES } from "../../../constants/database";

export const DatabaseMetricCards = ({ overview, isLoading }: DatabaseMetricCardsProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    const statusBadge = overview ? DATABASE_STATUS_BADGES[overview.status] : DATABASE_STATUS_BADGES.ONLINE;
    const latencyColor = overview && overview.latencyMs <= 10
        ? "text-cud-teal font-bold"
        : overview && overview.latencyMs <= 50
            ? "text-amber-400 font-bold"
            : "text-rose-400 font-bold";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Adatbázis Motor</span>
                    <div className="p-2 rounded-lg bg-cud-teal-bg border border-cud-teal-border text-cud-teal">
                        <Database className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <span className="text-xl font-bold text-slate-100 uppercase">
                        {overview?.engine || "Postgres"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {overview?.serverVersion || (overview?.mode === 'internal' ? "K8s CloudNative" : "Külső szolgáltatás")}
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Klaszter Állapot</span>
                    <div className="p-2 rounded-lg bg-cud-skyblue-bg border border-cud-skyblue-border text-cud-skyblue">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2 flex flex-col items-start gap-1">
                    <Badge
                        variant={statusBadge.variant}
                        text={statusBadge.text}
                        pulse={statusBadge.pulse}
                        size="md"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">
                        {overview?.mode === 'internal' ? "Belső HA Klaszter" : "Külső kapcsolat"}
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Válaszidő (Ping)</span>
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Zap className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <span className={`text-xl ${latencyColor}`}>
                        {overview ? `${overview.latencyMs} ms` : "0 ms"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {overview && overview.latencyMs <= 10 ? "Kiváló válaszidő" : "Normál latencia"}
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Kapcsolatok / Pool</span>
                    <div className="p-2 rounded-lg bg-cud-purple-bg border border-cud-purple-border text-cud-purple">
                        <Layers className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <span className="text-xl font-bold text-slate-100">
                        {overview ? `${overview.activeConnections} / ${overview.poolSize}` : "0 / 20"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {overview?.pgbouncerEnabled ? "PgBouncer pooling aktív" : "Direct connection"}
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Példányszám (HA)</span>
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Cpu className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <span className="text-xl font-bold text-slate-100">
                        {overview ? `${overview.replicas} db Pod` : "1 db Pod"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Max: {overview?.maxReplicas || 5} replika engedélyezve
                    </p>
                </div>
            </div>
        </div>
    );
};
