import {
    ArrowLeftRight,
    CheckCircle2,
    Clock,
    ExternalLink,
    GitBranch,
    GitCommit,
    Loader2,
    Pause,
    Play,
    RotateCcw,
    ShieldAlert,
    User,
    XCircle,
    ChevronRight,
    Zap
} from "lucide-react";
import { Button } from "../../common/Button";
import type { PipelineRunRowProps } from "../../../types/component/deployments/pipelineRunRowProps";
import type { PipelineStage, PipelineStageStatus } from "../../../types/pipeline";
import { PIPELINE_STATUS_CONFIG } from "../../../constants/deployments";

const renderStageIcon = (status: PipelineStageStatus) => {
    switch (status) {
        case "success":
            return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
        case "running":
            return <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />;
        case "failed":
            return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
        case "skipped":
            return <span className="text-[10px] text-slate-500 font-mono">-</span>;
        case "pending":
        default:
            return <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
};

const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return "-";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return `${mins}m ${rem}s`;
};

export const PipelineRunRow = ({
    run,
    onApproveClick,
    onRolloutAction,
    onStepCanary,
    isRolloutActing = false
}: PipelineRunRowProps) => {
    const statusMeta = PIPELINE_STATUS_CONFIG[run.status] ?? PIPELINE_STATUS_CONFIG.cancelled;
    const isWaitingApproval = run.status === "waiting_approval";

    return (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-bold text-slate-200">
                        #{run.runNumber}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                        {isWaitingApproval && <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />}
                        {statusMeta.label}
                    </span>

                    {run.rollout && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-xs shadow-inner">
                            {run.rollout.strategy === "Canary" ? (
                                <span className="flex items-center gap-1 font-mono font-bold text-cud-orange">
                                    <Zap className="w-3 h-3 text-cud-orange animate-pulse" />
                                    Canary {run.rollout.canaryWeight ?? 20}%
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 font-mono font-bold text-cud-teal">
                                    <ArrowLeftRight className="w-3 h-3 text-cud-teal" />
                                    Blue-Green ({run.rollout.blueGreenActive === "green" ? "Zöld" : "Kék"})
                                </span>
                            )}
                            {run.rollout.isPaused && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                    Szünet
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-xs font-mono text-cud-skyblue">
                        <GitBranch className="w-3 h-3" />
                        <span>{run.branch}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                        <GitCommit className="w-3 h-3 text-slate-500" />
                        <span>{run.commitHash ? run.commitHash.slice(0, 7) : "n/a"}</span>
                    </div>

                    <span className="text-sm font-medium text-slate-300 truncate max-w-xs sm:max-w-md">
                        {run.commitMessage || "Nincs megadott commit üzenet"}
                    </span>
                </div>

                <div className="flex items-center gap-2.5 self-end lg:self-center flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{run.author || "Rendszer"}</span>
                    </div>

                    {run.workflowUrl && (
                        <a
                            href={run.workflowUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-400 hover:text-cud-skyblue inline-flex items-center gap-1 transition-colors mr-1"
                        >
                            <span>Naplók</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}

                    {isWaitingApproval && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onApproveClick(run)}
                            icon={<ShieldAlert className="w-3.5 h-3.5" />}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                        >
                            Jóváhagyás
                        </Button>
                    )}

                    {run.rollout && !isWaitingApproval && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {run.rollout.strategy === "Canary" && (
                                <>
                                    {(run.rollout.canaryWeight ?? 0) < 100 && run.status !== "success" && run.status !== "failed" && run.status !== "cancelled" ? (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                loading={isRolloutActing}
                                                disabled={isRolloutActing}
                                                icon={<Zap className="w-3 h-3 text-cud-orange" />}
                                                onClick={() => onStepCanary?.(Math.min(100, (run.rollout?.canaryWeight ?? 20) + 25))}
                                                className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-semibold"
                                            >
                                                +25% Súly ({Math.min(100, (run.rollout.canaryWeight ?? 20) + 25)}%)
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                loading={isRolloutActing}
                                                disabled={isRolloutActing}
                                                icon={<Zap className="w-3 h-3" />}
                                                onClick={() => onRolloutAction?.("promote", true)}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                                            >
                                                Promote (100%)
                                            </Button>

                                            {run.rollout.isPaused ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    loading={isRolloutActing}
                                                    disabled={isRolloutActing}
                                                    icon={<Play className="w-3 h-3 text-emerald-400" />}
                                                    onClick={() => onRolloutAction?.("resume")}
                                                    className="text-xs"
                                                >
                                                    Folytatás
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    loading={isRolloutActing}
                                                    disabled={isRolloutActing}
                                                    icon={<Pause className="w-3 h-3 text-slate-400" />}
                                                    onClick={() => onRolloutAction?.("pause")}
                                                    className="text-xs"
                                                >
                                                    Szünet
                                                </Button>
                                            )}

                                            <Button
                                                variant="danger"
                                                size="sm"
                                                loading={isRolloutActing}
                                                disabled={isRolloutActing}
                                                icon={<RotateCcw className="w-3 h-3" />}
                                                onClick={() => onRolloutAction?.("abort")}
                                                className="text-xs"
                                            >
                                                Megszakítás
                                            </Button>
                                        </>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            100% Élesben (Promoted)
                                        </span>
                                    )}
                                </>
                            )}

                            {run.rollout.strategy === "BlueGreen" && (
                                <>
                                    {run.status === "success" || run.status === "failed" || run.status === "cancelled" ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Élesben ({run.rollout.blueGreenActive === "blue" ? "Kék aktív" : "Zöld aktív"})
                                        </span>
                                    ) : (
                                        <>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                loading={isRolloutActing}
                                                disabled={isRolloutActing}
                                                icon={<ArrowLeftRight className="w-3 h-3" />}
                                                onClick={() => onRolloutAction?.("promote", true)}
                                                className="bg-cud-teal hover:bg-cud-teal/80 text-white font-bold text-xs"
                                            >
                                                Forgalom Átkapcsolása ({run.rollout.blueGreenActive === "blue" ? "Zöldre" : "Kékre"})
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                loading={isRolloutActing}
                                                disabled={isRolloutActing}
                                                icon={<RotateCcw className="w-3 h-3" />}
                                                onClick={() => onRolloutAction?.("abort")}
                                                className="text-xs"
                                            >
                                                Megszakítás
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {run.rollout && run.rollout.strategy === "Canary" && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-cud-orange animate-pulse" />
                            <span className="font-semibold text-slate-200">Canary Forgalom Progress:</span>
                            <span className="font-mono font-bold text-cud-orange">{run.rollout.canaryWeight ?? 20}%</span>
                            {run.rollout.isPaused && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Szüneteltetve
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5 font-mono font-bold text-xs">
                            <span className="text-cud-orange">{run.rollout.canaryWeight ?? 20}% Új kiadás</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-cud-skyblue">{Math.max(0, 100 - (run.rollout.canaryWeight ?? 20))}% Stabil</span>
                        </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                        <div
                            style={{ width: `${run.rollout.canaryWeight ?? 20}%` }}
                            className="bg-cud-orange transition-all duration-500"
                            title={`Canary: ${run.rollout.canaryWeight ?? 20}%`}
                        />
                        <div
                            style={{ width: `${Math.max(0, 100 - (run.rollout.canaryWeight ?? 20))}%` }}
                            className="bg-cud-skyblue transition-all duration-500"
                            title={`Stabil: ${Math.max(0, 100 - (run.rollout.canaryWeight ?? 20))}%`}
                        />
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1 sm:gap-2 flex-wrap overflow-x-auto pb-1">
                {run.stages?.map((stage: PipelineStage, idx: number) => (
                    <div key={stage.id || idx} className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                            {renderStageIcon(stage.status)}
                            <span className="text-slate-300 font-medium whitespace-nowrap">{stage.name}</span>
                            <span className="text-[11px] font-mono text-slate-500 ml-1">
                                {formatDuration(stage.durationSeconds)}
                            </span>
                        </div>
                        {idx < run.stages.length - 1 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
