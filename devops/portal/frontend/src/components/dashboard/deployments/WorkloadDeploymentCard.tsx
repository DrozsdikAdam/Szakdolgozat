import { History, Sliders, Server, Tag, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "../../common/Card";
import { Button } from "../../common/Button";
import { StrategyBadge } from "./StrategyBadge";
import { RolloutVisualizer } from "./RolloutVisualizer";
import type { WorkloadDeploymentCardProps } from "../../../types/component/deployments/workloadDeploymentCardProps";

export const WorkloadDeploymentCard = ({ workload, onOpenStrategy, onOpenRollback, onQuickPromote, isMutating = false }: WorkloadDeploymentCardProps) => {
    const isSynced = workload.syncStatus === "Synced";
    const isHealthy = workload.healthStatus === "Healthy";

    return (
        <Card
            hoverEffect={false}
            className="flex flex-col justify-between h-full bg-slate-900/60 border-slate-800"
        >
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-100 text-base">
                                {workload.name}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {workload.namespace}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${isSynced
                                    ? "bg-cud-teal/10 text-cud-teal border-cud-teal/30"
                                    : "bg-cud-orange/10 text-cud-orange border-cud-orange/30"
                                    }`}
                                title={`GitOps szinkron állapot: ${workload.syncStatus}`}
                            >
                                {isSynced ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                    <AlertTriangle className="w-3 h-3" />
                                )}
                                <span>{isSynced ? "Synced" : "OutOfSync"}</span>
                            </span>
                            {!isHealthy && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-cud-skyblue/10 text-cud-skyblue border border-cud-skyblue/30">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Progressing</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                            <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-300 truncate max-w-xs" title={workload.currentImage}>
                                {workload.currentImage}
                            </span>
                        </div>
                    </div>

                    <StrategyBadge strategy={workload.strategy} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-mono">
                        <Server className="w-3.5 h-3.5 text-slate-500" />
                        <span>Replikák:</span>
                        <span className="font-bold text-slate-100">
                            {workload.replicas.available} / {workload.replicas.desired} fut
                        </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                        <span>{workload.history.length} revízió rögzítve</span>
                    </div>
                </div>

                <RolloutVisualizer
                    workload={workload}
                    onQuickPromote={onQuickPromote}
                    isMutating={isMutating}
                />
            </div>

            <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/80">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenRollback(workload)}
                    icon={<History className="w-3.5 h-3.5 text-cud-skyblue" />}
                >
                    Előzmények & Rollback
                </Button>

                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenStrategy(workload)}
                    icon={<Sliders className="w-3.5 h-3.5" />}
                >
                    Stratégia Módosítása
                </Button>
            </div>
        </Card>
    );
};
