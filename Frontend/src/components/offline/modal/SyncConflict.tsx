import { useEffect, useState } from "react";
import { useSyncStatus } from "../../../hooks/UseSyncStatus";
import { getConflictedActions, getPendingActions, syncOfflineQueue } from "../../../services/syncEngine";
import type { OfflineAction } from "../../../types/offline/offline";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import { ConflictCard } from "../ConflictCard";
import { Clock, AlertTriangle, RefreshCw } from "lucide-react";
import type { SyncConflictModalProps } from "../../../types/offline/offlineProps";
import { NavbarModal } from "../../common/modal/Navbar";

export const SyncConflictModal = ({ isOpen, onClose }: SyncConflictModalProps) => {
    const [activeTab, setActiveTab] = useState<"pending" | "conflicts">("pending");
    const [conflicts, setConflicts] = useState<OfflineAction[]>([]);
    const [pendingList, setPendingList] = useState<OfflineAction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { conflictCount, isSyncing } = useSyncStatus();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [conflictsData, pendingData] = await Promise.all([
                getConflictedActions(),
                getPendingActions()
            ]);
            setConflicts(conflictsData);
            setPendingList(pendingData);

            // Ha vannak konfliktusok, de nincs várakozó feladat, automatikusan a konfliktus fülre váltunk
            if (conflictsData.length > 0 && pendingData.length === 0) {
                setActiveTab("conflicts");
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        await syncOfflineQueue();
        loadData();
    };

    useEffect(() => {
        if (!isOpen) return;
        loadData();
    }, [conflictCount, isOpen]);

    if (!isOpen) return null;

    return (
        <NavbarModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    <RefreshCw size={16} className={`text-cud-skyblue ${isSyncing ? "animate-spin" : ""}`} />
                    <span>Offline Szinkronizáció</span>
                </span>
            }
            headerRight={
                navigator.onLine ? (
                    <button
                        disabled={isLoading || isSyncing}
                        onClick={handleRefresh}
                        className="flex items-center gap-1 text-xs text-cud-skyblue hover:opacity-80 font-medium disabled:opacity-50 cursor-pointer"
                        title="Szinkronizálás indítása"
                    >
                        <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                        <span>{isSyncing ? "Szinkronizálás..." : "Szinkronizálás"}</span>
                    </button>
                ) : undefined
            }
            bodyClassName="p-3 space-y-3 flex-1 overflow-y-auto"
        >
            <div className="flex rounded-xl bg-slate-950/60 p-1 border border-slate-800 shrink-0">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "pending"
                            ? "bg-(--cud-skyblue-bg) text-cud-skyblue border border-(--cud-skyblue-border) shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    <Clock size={13} />
                    <span>Várakozó</span>
                    {pendingList.length > 0 && (
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-1.5 py-0.2 rounded-full">
                            {pendingList.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("conflicts")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "conflicts"
                            ? "bg-(--cud-vermillon-bg) text-cud-vermillon border border-(--cud-vermillon-border) shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    <AlertTriangle size={13} />
                    <span>Ütközések</span>
                    {conflicts.length > 0 && (
                        <span className="text-[10px] bg-(--cud-vermillon) text-white px-1.5 py-0.2 rounded-full animate-pulse">
                            {conflicts.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="space-y-2">
                {error && <div className="text-xs text-cud-vermillon p-2 bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border) rounded-lg">{error}</div>}
                {isLoading && <LoadingSpinner />}

                {!isLoading && !error && activeTab === "pending" && (
                    pendingList.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                            <p className="font-medium text-slate-400">Nincsenek várakozó offline feladatok.</p>
                            <p className="text-[11px]">Minden rögzített adat szinkronizálva van a szerverrel.</p>
                        </div>
                    ) : (
                        pendingList.map((action) => (
                            <div key={action.id || action.uuid} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white">
                                        {action.entityName || "Offline művelet"}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-cud-skyblue border border-slate-600/60">
                                        {action.method}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>{new Date(action.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                                    <span className="text-cud-orange font-medium">● Várakozik a netre</span>
                                </div>
                            </div>
                        ))
                    )
                )}

                {!isLoading && !error && activeTab === "conflicts" && (
                    conflicts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                            <p className="font-medium text-slate-400">Nincsenek szinkronizációs ütközések.</p>
                            <p className="text-[11px]">A karantén sor jelenleg üres.</p>
                        </div>
                    ) : (
                        conflicts.map((conflict) => (
                            <ConflictCard
                                key={conflict.id}
                                conflict={conflict}
                                onResolved={loadData}
                            />
                        ))
                    )
                )}
            </div>
        </NavbarModal>
    );
};