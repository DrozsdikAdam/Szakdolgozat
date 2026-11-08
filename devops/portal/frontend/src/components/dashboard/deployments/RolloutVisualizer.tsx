import { ArrowLeftRight, CheckCircle2, Cpu, RefreshCw, Zap } from "lucide-react";
import type { RolloutVisualizerProps } from "../../../types/component/deployments/rolloutVisualizerProps";

export const RolloutVisualizer = ({ workload, onQuickPromote, isMutating = false }: RolloutVisualizerProps) => {
    const { strategy, canaryWeight = 0, blueGreenActive = "blue", replicas } = workload;

    if (strategy === "Canary") {
        const stableWeight = 100 - canaryWeight;
        return (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-cud-orange animate-pulse" />
                        <span className="font-semibold text-slate-200">Canary Forgalommegosztás</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {onQuickPromote && (
                            canaryWeight >= 100 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    100% Élesben
                                </span>
                            ) : (
                                <button
                                    onClick={() => onQuickPromote(workload)}
                                    disabled={isMutating}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cud-orange/15 text-cud-orange hover:bg-cud-orange/25 border border-cud-orange/30 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <Zap className="w-3 h-3" />
                                    <span>Súly Növelése (+25% → {Math.min(100, canaryWeight + 25)}%)</span>
                                </button>
                            )
                        )}
                        <div className="flex items-center gap-2 font-mono font-bold">
                            <span className="text-cud-orange">{canaryWeight}% Canary</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-cud-skyblue">{stableWeight}% Stabil</span>
                        </div>
                    </div>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                    <div
                        style={{ width: `${canaryWeight}%` }}
                        className="bg-cud-orange transition-all duration-500 relative group"
                        title={`Canary verzió: ${canaryWeight}%`}
                    />
                    <div
                        style={{ width: `${stableWeight}%` }}
                        className="bg-cud-skyblue transition-all duration-500"
                        title={`Stabil verzió: ${stableWeight}%`}
                    />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Tesztfázis aktív az új kiadáshoz</span>
                    <span className="font-mono text-slate-300">
                        {replicas.updated} / {replicas.desired} új pod fut
                    </span>
                </div>
            </div>
        );
    }

    if (strategy === "BlueGreen") {
        const isBlueActive = blueGreenActive === "blue";
        return (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Blue / Green Kettős Környezet</span>
                    {onQuickPromote && (
                        <button
                            onClick={() => onQuickPromote(workload)}
                            disabled={isMutating}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cud-teal/15 text-cud-teal hover:bg-cud-teal/25 border border-cud-teal/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Forgalom Átkapcsolása</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                        className={`p-2.5 rounded-lg border transition-all ${isBlueActive
                            ? "bg-cud-skyblue/10 border-cud-skyblue/40 text-slate-200"
                            : "bg-slate-900/50 border-slate-800/80 text-slate-400"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">KÉK (Blue)</span>
                            {isBlueActive && (
                                <span className="flex items-center gap-1 text-[10px] text-cud-teal font-mono font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> ÉLES
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            {isBlueActive ? "Kiszolgálja a kéréseket" : "Készenléti / Előnézeti"}
                        </p>
                    </div>

                    <div
                        className={`p-2.5 rounded-lg border transition-all ${!isBlueActive
                            ? "bg-cud-teal/10 border-cud-teal/40 text-slate-200"
                            : "bg-slate-900/50 border-slate-800/80 text-slate-400"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">ZÖLD (Green)</span>
                            {!isBlueActive && (
                                <span className="flex items-center gap-1 text-[10px] text-cud-teal font-mono font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> ÉLES
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            {!isBlueActive ? "Kiszolgálja a kéréseket" : "Készenléti / Előnézeti"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isFullyRolledOut = replicas.updated >= replicas.desired && replicas.available >= replicas.desired;
    return (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
                <RefreshCw
                    className={`w-4 h-4 ${isFullyRolledOut ? "text-cud-teal" : "text-cud-skyblue animate-spin"}`}
                />
                <div>
                    <span className="font-semibold text-slate-200 block">
                        {isFullyRolledOut ? "Gördülő Frissítés Stabil" : "Pod-csere folyamatban..."}
                    </span>
                    <span className="text-[11px] text-slate-400">
                        {replicas.updated} / {replicas.desired} pod a legújabb revízión
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>{replicas.available} / {replicas.desired} fut</span>
            </div>
        </div>
    );
};
