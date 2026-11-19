import { HardDrive, ShieldCheck, Layers, Folder } from "lucide-react";
import type { StorageMetricCardsProps } from "../../../types/component/storage/storageMetricCardsProps";
import { Badge } from "../../common/Badge";
import { Skeleton } from "../../common/Skeleton";
import { STORAGE_STATUS_BADGES } from "../../../constants/storage";

export const StorageMetricCards = ({ overview, isLoading }: StorageMetricCardsProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    const isInternal = overview?.mode === "internal";
    const statusBadge = overview
        ? STORAGE_STATUS_BADGES[overview.internal.status]
        : STORAGE_STATUS_BADGES.Running;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Tárhely Üzemmód</span>
                    <div className="p-2 rounded-lg bg-cud-teal-bg border border-cud-teal-border text-cud-teal">
                        <HardDrive className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <span className="text-xl font-bold text-slate-100">
                        {isInternal ? "Belső MinIO" : "Külső Felhő S3"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {isInternal ? "K8s Cloud-Native Objektumtár" : "Multi-Cloud Tárolási Végpont"}
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
                        {overview?.internal.serviceHealthy ? "Service elérhető (port 9000)" : "Szolgáltatás várakozik"}
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Allokált Kapacitás</span>
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Layers className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <span className="text-xl font-bold text-slate-100">
                        {overview?.internal.allocatedSizeGb ?? 5} GB
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Dinamikus PVC méret (max 10 GB)
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Alapértelmezett Bucket</span>
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Folder className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <span className="text-xl font-bold text-slate-100 truncate block">
                        {isInternal ? overview?.internal.bucketName : (overview?.external.bucketName || "Nincs beállítva")}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {isInternal ? "Automatikusan inicializált vödör" : (overview?.external.endpoint || "Külső bucket")}
                    </p>
                </div>
            </div>
        </div>
    );
};
