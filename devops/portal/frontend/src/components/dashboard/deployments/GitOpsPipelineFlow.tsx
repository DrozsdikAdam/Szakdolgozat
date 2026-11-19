import { useState } from "react";
import {
    GitBranch,
    RefreshCw,
    ShieldCheck,
    Cpu,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Info,
    CheckCircle2,
    Zap,
    ArrowLeftRight,
    Repeat
} from "lucide-react";
import type { GitOpsPipelineFlowProps } from "../../../types/component/deployments/gitOpsPipelineFlowProps";

export const GitOpsPipelineFlow = ({ gitRepo }: GitOpsPipelineFlowProps) => {
    const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

    if (!gitRepo) return null;

    const isSynced = gitRepo.syncStatus === "Synced";

    return (
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Info className="w-4 h-4 text-cud-skyblue" />
                    <span>Deklaratív GitOps Életciklus</span>
                </div>

                <div className="flex items-center flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                        <GitBranch className="w-3.5 h-3.5 text-cud-skyblue" />
                        <span className="text-slate-400 font-mono">Git:</span>
                        <span className="font-bold text-slate-200">{gitRepo.branch}</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 text-cud-teal animate-spin-slow" />
                        <span className="text-slate-400">Reconciler:</span>
                        <span className={`font-bold ${isSynced ? "text-cud-teal" : "text-cud-orange"}`}>
                            {isSynced ? "Szinkronban" : "Eltérés"}
                        </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-cud-teal" />
                        <span className="text-slate-400">Self-Heal:</span>
                        <span className="font-bold text-cud-teal">0 drift</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                        <Cpu className="w-3.5 h-3.5 text-cud-orange" />
                        <span className="text-slate-400">K8s Klaszter:</span>
                        <span className="font-bold text-slate-200">Éles Rollout</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsGuideOpen(!isGuideOpen)}
                    className="inline-flex items-center gap-1.5 text-xs text-cud-skyblue hover:text-slate-200 transition-colors font-medium cursor-pointer shrink-0"
                >
                    <span>{isGuideOpen ? "Útmutató elrejtése" : "Működési Útmutató"}</span>
                    {isGuideOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>

            {isGuideOpen && (
                <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/70 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                            <div className="flex items-center gap-2 text-cud-teal font-bold text-sm">
                                <Repeat className="w-4 h-4" />
                                <span>Gördülő Frissítés (Rolling)</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed text-[11px]">
                                A konténereket egyesével cseréli le a Kubernetes a legújabb revízióra, garantálva a folyamatos, 100%-os rendelkezésre állást és a leállás nélküli verzióváltást.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                            <div className="flex items-center gap-2 text-cud-orange font-bold text-sm">
                                <Zap className="w-4 h-4" />
                                <span>Canary Forgalommegosztás</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed text-[11px]">
                                A bejövő kérések egy meghatározott százalékát (pl. 10-25%) irányítja az új tesztverzióra, miközben a többség a stabil kiadást éri el. Kockázatmentes éles validálás.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                            <div className="flex items-center gap-2 text-cud-skyblue font-bold text-sm">
                                <ArrowLeftRight className="w-4 h-4" />
                                <span>Blue / Green Kettős Környezet</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed text-[11px]">
                                Párhuzamosan fut a stabil (Blue) és a felkészített új (Green) környezet. A forgalom átirányítása egyetlen kattintással, azonnal történik, azonnali visszavonási garanciával.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-cud-teal/10 border border-cud-teal/30 text-cud-teal text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                            <strong>Deklaratív Self-Healing:</strong> Ha a klaszterben manuális vagy váratlan eltérés (drift) keletkezik, a GitOps vezérlő a Git forrásfájlokhoz igazítva automatikusan helyreállítja a kívánt állapotot.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
