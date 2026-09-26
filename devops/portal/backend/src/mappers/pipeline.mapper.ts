import type { GitOpsDriftReport, PipelineRun, PipelineStage, PipelineStatus } from "../types/pipeline.types.js";
import type { PipelineConfig } from "../types/pipeline.types.js";

export class PipelineMapper {
    static toPipelineStatus(run: any): PipelineStatus {
        if (run.status === "waiting") return "waiting_approval";
        if (run.status !== "completed") return "in_progress";
        if (run.conclusion === "cancelled") return "cancelled";
        return run.conclusion === "success" ? "success" : "failed";
    }

    static toPipelineStages(status: PipelineStatus, startedAt?: string): PipelineStage[] {
        const isSuccess = status === "success";
        const isFailed = status === "failed";
        const isWaiting = status === "waiting_approval";
        const defaultStageStatus = isFailed ? "failed" : "success";

        return [
            { id: "backend-test", name: "Backend Tesztek", status: defaultStageStatus, durationSeconds: 42, ...(startedAt ? { startedAt } : {}) },
            { id: "frontend-test", name: "Frontend Tesztek", status: defaultStageStatus, durationSeconds: 28 },
            { id: "docker-build", name: "Docker Build", status: defaultStageStatus, durationSeconds: 65 },
            { id: "deploy-staging", name: "Staging Telepites", status: defaultStageStatus, durationSeconds: 30 },
            {
                id: "deploy-production",
                name: "Production Gate",
                status: isWaiting ? "pending" : (isSuccess ? "success" : "skipped"),
                durationSeconds: isSuccess ? 15 : 0
            }
        ];
    }

    static toPipelineRun(run: any, config: PipelineConfig): PipelineRun {
        const status = this.toPipelineStatus(run);
        const stages = this.toPipelineStages(status, run.created_at);

        return {
            id: String(run.id),
            runNumber: run.run_number,
            branch: run.head_branch || config.stagingBranch,
            commitHash: run.head_sha ? run.head_sha.substring(0, 7) : "HEAD",
            commitMessage: run.head_commit?.message || run.display_title || "CI/CD Pipeline Frissites",
            author: run.actor?.login || config.repoOwner,
            status,
            stages,
            workflowUrl: run.html_url || `https://github.com/${config.repoOwner}/${config.repoName}/actions`,
            createdAt: run.created_at,
            updatedAt: run.updated_at
        };
    }

    static toDriftReport(appBody: any, defaultNamespace: string, defaultBranch: string): GitOpsDriftReport {
        const syncStatus = appBody?.status?.sync?.status || "Unknown";
        const isSynced = syncStatus === "Synced";
        const targetRevision = appBody?.status?.sync?.revision || appBody?.spec?.source?.targetRevision || defaultBranch;

        const rawResources = appBody?.status?.resources || [];
        const outOfSyncResources = rawResources
            .filter((r: any) => r.status === "OutOfSync")
            .map((r: any) => ({
                kind: r.kind || "Unknown",
                name: r.name || "Unknown",
                namespace: r.namespace || defaultNamespace,
                status: r.status || "OutOfSync"
            }));

        return {
            isSynced,
            syncStatus: isSynced ? "Synced" : "OutOfSync",
            targetRevision: typeof targetRevision === "string" ? targetRevision.substring(0, 7) : "HEAD",
            outOfSyncResources
        };
    }
}
