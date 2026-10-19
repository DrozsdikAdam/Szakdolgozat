import { useState } from "react";
import {
    Activity,
    AlertTriangle,
    Check,
    GitBranch,
    Loader2,
    Play,
    RefreshCw
} from "lucide-react";
import { Button } from "../../common/Button";
import { EmptyState } from "../../common/EmptyState";
import { GitOpsDriftAlert } from "./GitOpsDriftAlert";
import { PipelineRunRow } from "./PipelineRunRow";
import { ManualApprovalModal } from "./ManualApprovalModal";
import { RolloutControlPanel } from "./RolloutControlPanel";
import type { PipelineStatusCenterProps } from "../../../types/component/deployments/pipelineStatusCenterProps";

export const PipelineStatusCenter = ({ pipelineCenter }: PipelineStatusCenterProps) => {
    const [targetBranch, setTargetBranch] = useState<string>("main");

    const {
        runs,
        driftReport,
        isLoading,
        isRefreshing,
        selectedRunForApproval,
        isApprovalModalOpen,
        isTriggering,
        isApproving,
        isRolloutActing,
        toastMessage,
        loadData,
        handleTriggerPipeline,
        handleOpenApprovalModal,
        handleCloseApprovalModal,
        handleApprovePipeline,
        handleRolloutAction
    } = pipelineCenter;

    const onTrigger = async () => {
        await handleTriggerPipeline(targetBranch.trim() || undefined);
    };

    return (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-cud-skyblue shrink-0">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <span>CI/CD & GitOps Pipeline Központ</span>
                            {isRefreshing && (
                                <Loader2 className="w-3.5 h-3.5 text-cud-skyblue animate-spin" />
                            )}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Automatizált építési, tesztelési, biztonsági ellenőrzési és fokozatos telepítési folyamatok.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-center">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                        <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            value={targetBranch}
                            onChange={(e) => setTargetBranch(e.target.value)}
                            placeholder="Ág neve (main)"
                            className="bg-transparent border-none text-slate-200 text-xs font-mono focus:outline-none w-24 sm:w-28"
                            disabled={isTriggering}
                        />
                    </div>

                    <Button
                        variant="primary"
                        size="sm"
                        loading={isTriggering}
                        disabled={isTriggering}
                        icon={<Play className="w-3.5 h-3.5" />}
                        onClick={onTrigger}
                        className="bg-cud-skyblue text-slate-950 font-bold"
                    >
                        Új futtatás
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={isRefreshing}
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />}
                        onClick={() => loadData(false)}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>

            <GitOpsDriftAlert driftReport={driftReport} />

            <RolloutControlPanel
                onAction={handleRolloutAction}
                isActing={isRolloutActing}
                activeStrategy={pipelineCenter.activeStrategy}
                onSwitchStrategy={pipelineCenter.handleSwitchStrategy}
                namespace={pipelineCenter.appNamespace}
                appName={pipelineCenter.appName}
            />

            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
                    <span>Legutóbbi Futtatások ({runs.length})</span>
                    <span>5-Lépcsős CI/CD Életciklus</span>
                </div>

                {isLoading && (
                    <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-cud-skyblue" />
                        <div>Pipeline adatok betöltése...</div>
                    </div>
                )}

                {!isLoading && runs.length === 0 && (
                    <EmptyState
                        title="Nincsenek aktív vagy korábbi futtatások"
                        description="Kattints az 'Új futtatás' gombra a CI/CD folyamat indításához a megadott Git ágon."
                    />
                )}

                {!isLoading && runs.length > 0 && (
                    <div className="space-y-2.5">
                        {runs.map((run) => (
                            <PipelineRunRow
                                key={run.id}
                                run={run}
                                onApproveClick={handleOpenApprovalModal}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ManualApprovalModal
                isOpen={isApprovalModalOpen}
                run={selectedRunForApproval}
                isSubmitting={isApproving}
                onClose={handleCloseApprovalModal}
                onApprove={handleApprovePipeline}
            />

            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${toastMessage.type === "success"
                        ? "bg-slate-900/95 border-cud-teal/50 text-cud-teal shadow-cud-teal/10"
                        : "bg-slate-900/95 border-cud-vermillon/50 text-cud-vermillon shadow-cud-vermillon/10"
                        }`}
                >
                    {toastMessage.type === "success" ? (
                        <Check className="w-4 h-4 shrink-0" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                </div>
            )}
        </div>
    );
};
