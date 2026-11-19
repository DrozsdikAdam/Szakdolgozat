import { useState } from "react";
import { retryConflict, discardConflict as discardLocalConflict } from "../../services/syncEngine";
import { quarantineService } from "../../services/quarantineService";
import { AlertTriangle, Trash2, CheckCircle2, ChevronDown, ChevronUp, Lock } from "lucide-react";
import type { ConflictCardProps } from "../../types/offline/offlineProps";
import type { QuarantineItemResponse } from "../../types/offline/quarantine";
import type { OfflineAction } from "../../types/offline/offline";

export const ConflictCard = ({ conflict, canManage = false, onResolved }: ConflictCardProps) => {
    const [isOperating, setIsOperating] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isServerItem = "payloadJson" in conflict;
    const serverItem = isServerItem ? (conflict as QuarantineItemResponse) : null;
    const localItem = !isServerItem ? (conflict as OfflineAction) : null;

    const entityName = isServerItem ? serverItem?.entityName : localItem?.entityName;
    const method = isServerItem ? serverItem?.httpMethod : localItem?.method;
    const endpoint = isServerItem ? serverItem?.endpointUrl : localItem?.endpoint;
    const rawTime = isServerItem ? serverItem?.createdAt : localItem?.timestamp;
    const errorText = isServerItem
        ? (serverItem?.errorMessage || "Verzióütközés: az adat módosult a szerveren, amíg offline voltál.")
        : (localItem?.error || "Helyi szinkronizációs hiba");

    const formattedTime = rawTime
        ? new Date(rawTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
        : "";

    // Szerveroldali ütközés: Kliens állapot felülírása (CLIENT_WINS)
    const handleClientWins = async () => {
        if (!serverItem?.id) return;
        try {
            setIsOperating(true);
            setErrorMessage(null);
            await quarantineService.resolveConflict(serverItem.id, {
                strategy: "CLIENT_WINS"
            });
            onResolved();
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Nem sikerült felülírni a szervert");
        } finally {
            setIsOperating(false);
        }
    };

    // Szerveroldali ütközés: Szerver állapot megtartása (SERVER_WINS - elvetés)
    const handleServerWins = async () => {
        if (!serverItem?.id) return;
        try {
            setIsOperating(true);
            setErrorMessage(null);
            await quarantineService.resolveConflict(serverItem.id, {
                strategy: "SERVER_WINS"
            });
            onResolved();
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Nem sikerült elvetni az ütközést");
        } finally {
            setIsOperating(false);
        }
    };

    // Helyi Dexie konfliktus: Újrapróbálás
    const handleRetryLocal = async () => {
        if (!localItem?.id) return;
        try {
            setIsOperating(true);
            setErrorMessage(null);
            await retryConflict(localItem.id);
            onResolved();
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Újrapróbálási hiba");
        } finally {
            setIsOperating(false);
        }
    };

    // Helyi Dexie konfliktus: Elvetés
    const handleDiscardLocal = async () => {
        if (!localItem?.id) return;
        try {
            setIsOperating(true);
            setErrorMessage(null);
            await discardLocalConflict(localItem.id);
            onResolved();
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Elvetési hiba");
        } finally {
            setIsOperating(false);
        }
    };

    const formatJson = (jsonString?: string | null) => {
        if (!jsonString) return "Nincs elérhető adat";
        try {
            return JSON.stringify(JSON.parse(jsonString), null, 2);
        } catch {
            return jsonString;
        }
    };
    const clientPayloadString = isServerItem
        ? serverItem?.payloadJson
        : (localItem?.payload !== undefined ? JSON.stringify(localItem?.payload) : null);

    const serverStateString = isServerItem
        ? serverItem?.serverStateJson
        : (localItem?.serverConflictData ? JSON.stringify(localItem.serverConflictData) : null);

    const hasDiffData = Boolean(clientPayloadString || serverStateString);

    return (
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 hover:border-slate-600/80 transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-(--cud-vermillon-bg) text-cud-vermillon border border-(--cud-vermillon-border)">
                        <AlertTriangle size={15} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white leading-tight">
                            {entityName || "Ütközéses művelet"}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                            {formattedTime} • {endpoint}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-(--cud-orange-bg) text-cud-orange border border-(--cud-orange-border)">
                        {isServerItem ? "Karantén" : "Helyi ütközés"}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-cud-skyblue border border-slate-600/60">
                        {method}
                    </span>
                </div>
            </div>

            <div className="p-2 rounded-lg bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border) text-cud-vermillon text-xs">
                <p className="font-semibold text-[11px] mb-0.5">Ütközés oka / Szerver válasza:</p>
                <p className="line-clamp-3 text-[11px]">{errorText}</p>
            </div>

            {/* Részletek kibontása (Kliens adat vs. Szerver állapot) */}
            {hasDiffData && (
                <div className="space-y-1.5">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        <span>{isExpanded ? "Adatok elrejtése" : "Adatok összehasonlítása"}</span>
                    </button>

                    {isExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-950/70 rounded-lg border border-slate-800 text-[10px] font-mono">
                            <div>
                                <span className="font-bold text-cud-skyblue block mb-1">Kliens módosítás:</span>
                                <pre className="p-1.5 bg-slate-900 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-36">
                                    {formatJson(clientPayloadString)}
                                </pre>
                            </div>
                            <div>
                                <span className="font-bold text-cud-orange block mb-1">Szerver állapot:</span>
                                <pre className="p-1.5 bg-slate-900 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-36">
                                    {formatJson(serverStateString)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {errorMessage && (
                <div className="text-[11px] text-cud-vermillon bg-red-950/40 p-1.5 rounded border border-red-800/60">
                    {errorMessage}
                </div>
            )}

            {/* Akciógombok és jogosultságkezelés */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/40 flex-wrap">
                {!canManage ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic py-1">
                        <Lock size={12} className="text-cud-orange" />
                        <span>Vezetői jóváhagyásra vár (Manager / Admin jog szükséges)</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-2 w-full flex-wrap">
                        <button
                            type="button"
                            disabled={isOperating}
                            onClick={isServerItem ? handleServerWins : handleDiscardLocal}
                            title="Szerver állapot megtartása és a kliens kérés elvetése"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600/70 transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
                        >
                            <Trash2 size={13} className="shrink-0 text-cud-vermillon" />
                            <span>Szerver megtartása (Elvetés)</span>
                        </button>
                        <button
                            type="button"
                            disabled={isOperating}
                            onClick={isServerItem ? handleClientWins : handleRetryLocal}
                            title="Kliens oldali adat felülírása a szerveren"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--cud-skyblue) hover:opacity-90 text-slate-950 shadow-sm transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
                        >
                            <CheckCircle2 size={13} className={`shrink-0 ${isOperating ? "animate-spin" : ""}`} />
                            <span>{isOperating ? "Alkalmazás..." : "Kliens felülírása"}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};