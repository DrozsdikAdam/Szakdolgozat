import { useState } from "react";
import { History, RotateCcw, CheckCircle2, GitCommit, Clock, AlertTriangle } from "lucide-react";
import type { DeploymentRevision } from "../../../types/deployments";
import type { RollbackModalProps } from "../../../types/component/deployments/rollbackModalProps";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";

export const RollbackModal = ({ isOpen, onClose, workload, onRollback, isRollingBack }: RollbackModalProps) => {
    const [selectedRevision, setSelectedRevision] = useState<DeploymentRevision | null>(null);

    if (!workload) return null;

    const handleConfirm = async () => {
        if (!selectedRevision) return;
        await onRollback({
            deploymentName: workload.name,
            namespace: workload.namespace,
            targetRevision: selectedRevision.revision
        });
        setSelectedRevision(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setSelectedRevision(null);
                onClose();
            }}
            title={`Revízió Előzmények & Rollback — ${workload.name}`}
            subtitle={`${workload.namespace} névtér · jelenlegi verzió: ${workload.currentImage}`}
            icon={<History className="w-5 h-5 text-cud-skyblue" />}
            maxWidth="2xl"
            footer={
                <div className="flex items-center justify-between w-full p-2">
                    <div className="text-xs text-slate-400">
                        {selectedRevision ? (
                            <span className="text-cud-orange font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Visszaállítás cél: #{selectedRevision.revision} ({selectedRevision.imageTag})
                            </span>
                        ) : (
                            <span>Válassz egy korábbi revíziót a visszaállításhoz.</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => {
                                setSelectedRevision(null);
                                onClose();
                            }}
                            disabled={isRollingBack}
                        >
                            Bezárás
                        </Button>
                        {selectedRevision && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleConfirm}
                                loading={isRollingBack}
                                disabled={isRollingBack}
                                icon={<RotateCcw className="w-4 h-4" />}
                            >
                                Rollback Indítása
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-3 p-1">
                <p className="text-xs text-slate-400">
                    A lenti idővonal tartalmazza a workload korábbi sikeres kiadásait. Egy korábbi verzió kiválasztásával a rendszer gördülő módon visszaállítja a podokat a megadott revízióra.
                </p>

                <div className="space-y-2.5 max-h-105 overflow-y-auto pr-1">
                    {workload.history.map((rev) => {
                        const isActive = rev.status === "active";
                        const isSelected = selectedRevision?.revision === rev.revision;

                        return (
                            <div
                                key={rev.revision}
                                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isSelected
                                    ? "bg-cud-orange/10 border-cud-orange/50 shadow-md"
                                    : isActive
                                        ? "bg-cud-teal/10 border-cud-teal/40"
                                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                                    }`}
                            >
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-900 text-slate-100 border border-slate-700">
                                            #{rev.revision}
                                        </span>
                                        <span className="font-mono text-xs font-bold text-slate-200">
                                            {rev.imageTag}
                                        </span>
                                        {isActive ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cud-teal/20 text-cud-teal border border-cud-teal/30">
                                                <CheckCircle2 className="w-3 h-3" /> Jelenleg Aktív
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                                Archivált revízió
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                        <span className="flex items-center gap-1 font-mono">
                                            <GitCommit className="w-3 h-3 text-slate-500" />
                                            <span>{rev.commitHash}</span>
                                        </span>
                                        <span>·</span>
                                        <span>{rev.author}</span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <Clock className="w-3 h-3 text-slate-500" />
                                            <span>{new Date(rev.deployedAt).toLocaleString()}</span>
                                        </span>
                                    </div>
                                </div>

                                {!isActive && (
                                    <Button
                                        variant={isSelected ? "primary" : "secondary"}
                                        size="sm"
                                        onClick={() => setSelectedRevision(rev)}
                                        disabled={isRollingBack}
                                        icon={<RotateCcw className="w-3 h-3" />}
                                    >
                                        {isSelected ? "Kijelölve" : "Visszaállítás erre"}
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};
