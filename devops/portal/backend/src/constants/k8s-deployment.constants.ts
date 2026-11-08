import type { GitRepoConfig, DeploymentStrategy } from "../types/deployment.dto.js";
import type { WorkloadMetadata } from "../types/k8s.types.js";
export type { WorkloadMetadata };

export const DEFAULT_GITOPS_REPO: GitRepoConfig = {
    repoUrl: process.env.GIT_REPO_URL || "https://github.com/gitops/repository.git",
    branch: process.env.PRODUCTION_BRANCH || "main",
    path: "k8s/overlays/production",
    syncStatus: "Synced",
    autoSync: true,
    selfHeal: true,
    lastSyncTime: new Date().toISOString(),
    lastCommit: {
        hash: "HEAD",
        message: "Deklaratív GitOps szinkronizáció",
        author: "GitOps Reconciler",
        timestamp: new Date().toISOString()
    }
};

export const createDefaultWorkloadMetadata = (
    workloadName: string,
    imageTag?: string,
    strategy: DeploymentStrategy = "RollingUpdate"
): WorkloadMetadata => ({
    strategy,
    canaryWeight: strategy === "Canary" ? 20 : 0,
    blueGreenActive: "blue",
    syncStatus: "Synced",
    healthStatus: "Healthy",
    history: [
        {
            revision: 1,
            imageTag: imageTag || `${workloadName}:latest`,
            deployedAt: new Date().toISOString(),
            status: "active",
            commitHash: "gitops-init",
            author: "System",
            strategy
        }
    ]
});

export const DEFAULT_WORKLOAD_METADATA: Record<string, WorkloadMetadata> = {};
