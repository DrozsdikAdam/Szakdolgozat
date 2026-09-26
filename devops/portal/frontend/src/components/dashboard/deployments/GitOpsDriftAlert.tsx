import { AlertTriangle, GitCompare, RefreshCw } from "lucide-react";
import { Button } from "../../common/Button";
import type { GitOpsDriftAlertProps } from "../../../types/component/deployments/gitOpsDriftAlertProps";

export const GitOpsDriftAlert = ({ driftReport, onSync, isSyncing = false }: GitOpsDriftAlertProps) => {
    if (!driftReport || driftReport.syncStatus === "Synced") {
        return null;
    }

    const outOfSyncCount = driftReport.outOfSyncResources?.length ?? 0;

    return (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3 shadow-lg shadow-black/20 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-amber-100 uppercase tracking-wide">
                                GitOps Eltérés Észlelve (Drift / OutOfSync)
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                                {outOfSyncCount} eltérő erőforrás
                            </span>
                        </div>
                        <p className="text-xs text-amber-200/80 mt-1">
                            A Kubernetes klaszteren futó állapot eltér a Git repositoryban definiált kívánt állapottól.
                        </p>
                    </div>
                </div>

                {onSync && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onSync}
                        loading={isSyncing}
                        disabled={isSyncing}
                        icon={<RefreshCw className="w-3.5 h-3.5 text-amber-300" />}
                        className="self-start sm:self-center bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border-amber-500/40"
                    >
                        GitOps Újraszinkronizálás
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20 text-xs">
                <div className="flex items-center gap-1.5 font-mono bg-slate-950/60 px-2.5 py-1 rounded-lg border border-amber-500/20 text-slate-300">
                    <GitCompare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cél revízió:</span>
                    <span className="font-bold text-amber-300">{driftReport.targetRevision.slice(0, 7)}</span>
                </div>

                {driftReport.outOfSyncResources?.map((res, idx) => (
                    <span
                        key={`${res.kind}-${res.name}-${idx}`}
                        className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 font-mono text-[11px] text-slate-300"
                    >
                        {res.kind}/{res.name}
                    </span>
                ))}
            </div>
        </div>
    );
};
