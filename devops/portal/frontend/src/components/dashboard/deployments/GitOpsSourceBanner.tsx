import { GitBranch, GitCommit, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { Button } from "../../common/Button";
import type { GitOpsSourceBannerProps } from "../../../types/component/deployments/gitOpsSourceBannerProps";

export const GitOpsSourceBanner = ({ gitRepo, onSync, isSyncing }: GitOpsSourceBannerProps) => {
    if (!gitRepo) return null;

    const isSynced = gitRepo.syncStatus === "Synced";

    return (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg shadow-black/20 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-cud-skyblue shrink-0">
                        <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                GitOps Forrás Repository
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cud-skyblue border border-slate-700">
                                {gitRepo.branch}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-950/60 border border-slate-800">
                                {gitRepo.path}
                            </span>
                        </div>
                        <a
                            href={gitRepo.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-slate-200 hover:text-cud-skyblue transition-colors font-mono mt-0.5 block truncate max-w-xl"
                        >
                            {gitRepo.repoUrl}
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-center">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${isSynced
                                ? "bg-cud-teal/15 text-cud-teal border-cud-teal/30"
                                : "bg-cud-orange/15 text-cud-orange border-cud-orange/30"
                            }`}
                    >
                        {isSynced ? (
                            <CheckCircle2 className="w-4 h-4 text-cud-teal" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-cud-orange" />
                        )}
                        <span>{isSynced ? "Szinkronizálva (Synced)" : "Eltérés (OutOfSync)"}</span>
                    </span>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onSync}
                        loading={isSyncing}
                        disabled={isSyncing}
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />}
                    >
                        Szinkronizálás (Sync)
                    </Button>
                </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                    <GitCommit className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="px-2 py-0.5 rounded bg-slate-900 font-mono font-bold text-slate-200 border border-slate-700 shrink-0">
                        {gitRepo.lastCommit.hash}
                    </span>
                    <span className="text-slate-300 truncate font-medium">
                        {gitRepo.lastCommit.message}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 shrink-0">
                    <span className="text-slate-300 font-medium">
                        {gitRepo.lastCommit.author}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(gitRepo.lastCommit.timestamp).toLocaleTimeString()}</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-cud-teal">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Self-Heal: Aktív</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
