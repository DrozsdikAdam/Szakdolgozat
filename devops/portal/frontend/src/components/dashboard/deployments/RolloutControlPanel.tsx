import { Sliders } from "lucide-react";
import type { RolloutControlPanelProps } from "../../../types/component/deployments/rolloutControlPanelProps";

export const RolloutControlPanel = ({
    activeStrategy = "canary",
    onSwitchStrategy,
    namespace = "app-mes",
    appName = "mes-backend",
    canaryWeight = 20,
    blueGreenActive = "blue",
    isPaused = false,
    isActing = false
}: RolloutControlPanelProps) => {
    const isCanary = activeStrategy === "canary";
    const isBlueActive = blueGreenActive === "blue";

    return (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-cud-skyblue shrink-0">
                    <Sliders className="w-4 h-4" />
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Argo Rollout Vezérlőpult
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-950/70 border border-slate-800 text-slate-400">
                            {namespace} / {appName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${isCanary
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-teal-500/15 text-teal-300 border-teal-500/30"
                            }`}>
                            {isCanary ? `Canary (${canaryWeight}%)` : `Blue-Green (${isBlueActive ? "Kék" : "Zöld"})`}
                        </span>
                        {isPaused && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Szüneteltetve
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        A telepítési stratégia közvetlen váltása és felülbírálása. Az aktív kiadás vezérlése a futtatási kártyán érhető el.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {onSwitchStrategy && (
                    <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">Stratégia:</span>
                        <button
                            type="button"
                            disabled={isActing}
                            onClick={() => onSwitchStrategy("canary")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${isCanary
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            Canary
                        </button>
                        <button
                            type="button"
                            disabled={isActing}
                            onClick={() => onSwitchStrategy("bluegreen")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${!isCanary
                                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            Blue-Green
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
