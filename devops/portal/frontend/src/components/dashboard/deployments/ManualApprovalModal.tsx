import { useState } from "react";
import { ShieldCheck, ShieldAlert, GitCommit, GitBranch, User, AlertCircle } from "lucide-react";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";
import type { ManualApprovalModalProps } from "../../../types/component/deployments/manualApprovalModalProps";

export const ManualApprovalModal = ({ isOpen, run, isSubmitting, onClose, onApprove }: ManualApprovalModalProps) => {
    const [comment, setComment] = useState<string>("");

    if (!run) return null;

    const handleDecision = async (decision: "approved" | "rejected") => {
        await onApprove(decision, comment.trim() || undefined);
        setComment("");
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Production Gate Jóváhagyás: #${run.runNumber}`}
            subtitle="Éles környezetbe történő kiadás ellenőrzése és engedélyezése"
            icon={<ShieldAlert className="w-5 h-5 text-amber-400" />}
            maxWidth="lg"
            footer={
                <div className="flex items-center justify-between w-full px-5 py-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Mégse
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="danger"
                            size="sm"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            onClick={() => handleDecision("rejected")}
                        >
                            Elutasítás
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            icon={<ShieldCheck className="w-4 h-4" />}
                            onClick={() => handleDecision("approved")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                            Jóváhagyás & Élesítés
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="p-5 space-y-4 overflow-y-auto">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono text-slate-200">
                            <GitBranch className="w-3.5 h-3.5 text-cud-skyblue" />
                            {run.branch}
                        </span>
                        <span className="flex items-center gap-1.5 font-mono">
                            <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                            {run.commitHash ? run.commitHash.slice(0, 7) : "n/a"}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {run.author || "Ismeretlen"}
                        </span>
                    </div>

                    <div className="text-slate-300 text-sm font-medium pt-1 border-t border-slate-800/80">
                        {run.commitMessage || "Nincs megadott üzenet"}
                    </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                        A jóváhagyást követően a CI/CD folyamat azonnal megkezdi a konténerek éles Kubernetes klaszterre történő telepítését (Canary / Blue-Green stratégia szerint).
                    </span>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                        Jóváhagyói megjegyzés (opcionális feljegyzés az audit naplóhoz):
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Pl.: Tesztelve a staging környezeten, QA által ellenőrizve..."
                        disabled={isSubmitting}
                        rows={3}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cud-skyblue transition-all resize-none"
                    />
                </div>
            </div>
        </Modal>
    );
};
