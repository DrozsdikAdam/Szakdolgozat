import { Pause, Play, RotateCcw, Sliders, Zap } from "lucide-react";
import { Button } from "../../common/Button";
import type { RolloutControlPanelProps } from "../../../types/component/deployments/rolloutControlPanelProps";

export const RolloutControlPanel = ({ onAction, isActing }: RolloutControlPanelProps) => {
    return (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-cud-skyblue shrink-0">
                    <Sliders className="w-4 h-4" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Argo Rollout Vezérlőpult
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-950/70 border border-slate-800 text-slate-400">
                            app-mes / mes-backend-canary
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        A futó canary vagy blue-green kiadás közvetlen manuális felülbírálása és irányítása.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    variant="primary"
                    size="sm"
                    loading={isActing}
                    disabled={isActing}
                    icon={<Zap className="w-3.5 h-3.5" />}
                    onClick={() => onAction("promote", true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                    Promote (100%)
                </Button>

                <Button
                    variant="secondary"
                    size="sm"
                    loading={isActing}
                    disabled={isActing}
                    icon={<Pause className="w-3.5 h-3.5 text-slate-400" />}
                    onClick={() => onAction("pause")}
                >
                    Szünet
                </Button>

                <Button
                    variant="secondary"
                    size="sm"
                    loading={isActing}
                    disabled={isActing}
                    icon={<Play className="w-3.5 h-3.5 text-slate-400" />}
                    onClick={() => onAction("resume")}
                >
                    Folytatás
                </Button>

                <Button
                    variant="danger"
                    size="sm"
                    loading={isActing}
                    disabled={isActing}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => onAction("abort")}
                >
                    Megszakítás
                </Button>
            </div>
        </div>
    );
};
