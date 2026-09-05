import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSyncStatus } from "../../../hooks/UseSyncStatus";
import { getConflictedActions, getPendingActions, syncOfflineQueue } from "../../../services/syncEngine";
import type { OfflineAction } from "../../../types/offline/offline";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import { ConflictCard } from "../ConflictCard";
import { X, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import type { SyncConflictModalProps } from "../../../types/offline/offlineProps";

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

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs sm:bg-transparent"
                onClick={onClose}
            />
            <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 z-50 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-3.5 border-b border-slate-800 bg-slate-800/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                            Offline Szinkronizáció
                        </span>
                        <div className="flex items-center gap-2">
                            {navigator.onLine && (
                                <button
                                    disabled={isLoading || isSyncing}
                                    onClick={handleRefresh}
                                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
                                    title="Szinkronizálás indítása"
                                >
                                    <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                                    <span>{isSyncing ? "Szinkronizálás..." : "Szinkronizálás"}</span>
                                </button>
                            )}
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
                                    title="Bezárás"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex rounded-xl bg-slate-950/60 p-1 border border-slate-800">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "pending"
                                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
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
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "conflicts"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <AlertTriangle size={13} />
                            <span>Ütközések</span>
                            {conflicts.length > 0 && (
                                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                                    {conflicts.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto overflow-x-hidden divide-y divide-slate-800/60 p-2 space-y-2 flex-1">
                    {error && <div className="text-xs text-rose-400 p-2 bg-rose-500/10 rounded-lg">{error}</div>}
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
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-indigo-300 border border-slate-600/60">
                                            {action.method}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>{new Date(action.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                                        <span className="text-amber-400 font-medium">● Várakozik a netre</span>
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
            </div>
        </>,
        document.body
    );
};