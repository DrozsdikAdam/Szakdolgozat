import { useState } from "react";
import { retryConflict, discardConflict } from "../../services/syncEngine";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import type { ConflictCardProps } from "../../types/offline/offlineProps";

export const ConflictCard = ({ conflict, onResolved }: ConflictCardProps) => {

    const [isOperating, setIsOperating] = useState<boolean>(false);

    const handleRetry = async () => {
        if (!conflict.id) return;
        try {
            setIsOperating(true);
            await retryConflict(conflict.id);
            onResolved();
        } finally {
            setIsOperating(false);
        }
    };

    const handleDiscard = async () => {
        if (!conflict.id) return;
        try {
            setIsOperating(true);
            await discardConflict(conflict.id);
            onResolved();
        } finally {
            setIsOperating(false);
        }
    };

    const formattedTime = new Date(conflict.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    return (
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 hover:border-slate-600/80 transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-(--cud-vermillon-bg) text-cud-vermillon border border-(--cud-vermillon-border)">
                        <AlertTriangle size={15} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white leading-tight">
                            {conflict.entityName || "Ütközéses művelet"}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                            {formattedTime} • {conflict.endpoint}
                        </span>
                    </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-cud-skyblue border border-slate-600/60">
                    {conflict.method}
                </span>
            </div>

            <div className="p-2 rounded-lg bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border) text-cud-vermillon text-xs">
                <p className="font-semibold text-[11px] mb-0.5">Szerver válasza:</p>
                <p className="line-clamp-3 text-[11px]">{conflict.error || "Ismeretlen hiba vagy adatütközés"}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-700/40 flex-wrap">
                <button
                    type="button"
                    disabled={isOperating}
                    onClick={handleDiscard}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-cud-vermillon hover:opacity-90 hover:bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border) transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                    <Trash2 size={13} className="shrink-0" />
                    <span>Elvetés</span>
                </button>
                <button
                    type="button"
                    disabled={isOperating}
                    onClick={handleRetry}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--cud-skyblue) hover:opacity-90 text-slate-950 shadow-sm transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                    <RefreshCw size={13} className={`shrink-0 ${isOperating ? "animate-spin" : ""}`} />
                    <span>{isOperating ? "Próbálkozás..." : "Újrapróbálás"}</span>
                </button>
            </div>
        </div>
    );
};