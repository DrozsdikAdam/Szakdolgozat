import {
    CheckCircle2,
    Clock,
    ExternalLink,
    GitBranch,
    GitCommit,
    Loader2,
    ShieldAlert,
    User,
    XCircle,
    ChevronRight
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

export const PipelineRunRow = ({ run, onApproveClick }: PipelineRunRowProps) => {
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

                <div className="flex items-center gap-3 self-end lg:self-center">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{run.author || "Rendszer"}</span>
                    </div>

                    {run.workflowUrl && (
                        <a
                            href={run.workflowUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-400 hover:text-cud-skyblue inline-flex items-center gap-1 transition-colors"
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
                </div>
            </div>

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
