import type { PipelineRun, RolloutActionRequest } from "../types/pipeline.types.js";

export const ROLLOUT_PATCH_MAP: Record<RolloutActionRequest["action"], object> = {
    promote: { spec: { paused: false } },
    pause: { spec: { paused: true } },
    resume: { spec: { paused: false } },
    abort: { status: { abort: true } },
    rollback: { spec: { rollback: true } }
};

export const createFallbackPipelineRuns = (repoOwner: string, repoName: string, prodBranch: string, stagingBranch: string): PipelineRun[] => {
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const baseUrl = `https://github.com/${repoOwner}/${repoName}/actions`;

    return [
        {
            id: "run-101",
            runNumber: 42,
            branch: prodBranch,
            commitHash: "c8e4a1b",
            commitMessage: "feat: add telemetry endpoints and approval gate",
            author: repoOwner,
            status: "waiting_approval",
            workflowUrl: baseUrl,
            createdAt: tenMinsAgo,
            updatedAt: now.toISOString(),
            stages: [
                { id: "backend-test", name: "Backend Tesztek", status: "success", durationSeconds: 45 },
                { id: "frontend-test", name: "Frontend Tesztek", status: "success", durationSeconds: 32 },
                { id: "docker-build", name: "Docker Build", status: "success", durationSeconds: 58 },
                { id: "deploy-staging", name: "Staging Telepites", status: "success", durationSeconds: 24 },
                { id: "deploy-production", name: "Production Gate", status: "pending", durationSeconds: 0 }
            ]
        },
        {
            id: "run-100",
            runNumber: 41,
            branch: stagingBranch,
            commitHash: "b3f2e9c",
            commitMessage: "chore: update Kustomize staging overlays",
            author: repoOwner,
            status: "success",
            workflowUrl: baseUrl,
            createdAt: oneHourAgo,
            updatedAt: tenMinsAgo,
            stages: [
                { id: "backend-test", name: "Backend Tesztek", status: "success", durationSeconds: 40 },
                { id: "frontend-test", name: "Frontend Tesztek", status: "success", durationSeconds: 29 },
                { id: "docker-build", name: "Docker Build", status: "success", durationSeconds: 50 },
                { id: "deploy-staging", name: "Staging Telepites", status: "success", durationSeconds: 22 },
                { id: "deploy-production", name: "Production Gate", status: "skipped", durationSeconds: 0 }
            ]
        }
    ];
};
