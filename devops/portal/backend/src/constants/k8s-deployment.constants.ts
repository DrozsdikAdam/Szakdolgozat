import type { GitRepoConfig } from "../types/deployment.dto.js";
import type { WorkloadMetadata } from "../types/k8s.types.js";
import { DEFAULT_APP_NAMESPACE, DEFAULT_PLATFORM_NAMESPACE, DEFAULT_APP_NAME } from "./namespace.constants.js";
export type { WorkloadMetadata };

export const DEFAULT_GITOPS_REPO: GitRepoConfig = {
    repoUrl: "https://github.com/DrozsdikAdam/Szakdolgozat-GitOps.git",
    branch: "main",
    path: "k8s/overlays/production",
    syncStatus: "Synced",
    autoSync: true,
    selfHeal: true,
    lastSyncTime: new Date().toISOString(),
    lastCommit: {
        hash: "a4f891b",
        message: "feat(gitops): update canary traffic and pgbouncer config",
        author: "Drozsdik Ádám",
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    }
};

export const DEFAULT_WORKLOAD_METADATA: Record<string, WorkloadMetadata> = {
    [`${DEFAULT_APP_NAMESPACE}/${DEFAULT_APP_NAME}`]: {
        strategy: "BlueGreen",
        canaryWeight: 0,
        blueGreenActive: "blue",
        syncStatus: "Synced",
        healthStatus: "Healthy",
        history: [
            {
                revision: 3,
                imageTag: `${DEFAULT_APP_NAME}:1.4.2`,
                deployedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                status: "active",
                commitHash: "a4f891b",
                author: "Drozsdik Ádám",
                strategy: "Canary"
            },
            {
                revision: 2,
                imageTag: `${DEFAULT_APP_NAME}:1.4.1`,
                deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
                status: "superseded",
                commitHash: "7b32c0f",
                author: "Drozsdik Ádám",
                strategy: "RollingUpdate"
            },
            {
                revision: 1,
                imageTag: `${DEFAULT_APP_NAME}:1.4.0`,
                deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                status: "superseded",
                commitHash: "1e899d2",
                author: "Drozsdik Ádám",
                strategy: "RollingUpdate"
            }
        ]
    },
    [`${DEFAULT_PLATFORM_NAMESPACE}/portal-backend`]: {
        strategy: "RollingUpdate",
        canaryWeight: 0,
        blueGreenActive: "blue",
        syncStatus: "Synced",
        healthStatus: "Healthy",
        history: [
            {
                revision: 4,
                imageTag: "portal-backend:1.2.0",
                deployedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                status: "active",
                commitHash: "9c12a88",
                author: "Drozsdik Ádám",
                strategy: "RollingUpdate"
            },
            {
                revision: 3,
                imageTag: "portal-backend:1.1.9",
                deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
                status: "superseded",
                commitHash: "44df901",
                author: "Drozsdik Ádám",
                strategy: "RollingUpdate"
            }
        ]
    },
    [`${DEFAULT_PLATFORM_NAMESPACE}/haproxy`]: {
        strategy: "BlueGreen",
        canaryWeight: 0,
        blueGreenActive: "blue",
        syncStatus: "Synced",
        healthStatus: "Healthy",
        history: [
            {
                revision: 2,
                imageTag: "haproxy:2.8-alpine",
                deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                status: "active",
                commitHash: "ff23801",
                author: "Drozsdik Ádám",
                strategy: "BlueGreen"
            },
            {
                revision: 1,
                imageTag: "haproxy:2.7-alpine",
                deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
                status: "superseded",
                commitHash: "110acb3",
                author: "Drozsdik Ádám",
                strategy: "RollingUpdate"
            }
        ]
    },
    [`${DEFAULT_PLATFORM_NAMESPACE}/pgbouncer`]: {
        strategy: "RollingUpdate",
        canaryWeight: 0,
        blueGreenActive: "blue",
        syncStatus: "Synced",
        healthStatus: "Healthy",
        history: [
            {
                revision: 1,
                imageTag: "edoburu/pgbouncer:v1.21.0",
                deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
                status: "active",
                commitHash: "88a00bc",
                author: "Drozsdik Ádám",
                strategy: "RollingUpdate"
            }
        ]
    },
    [`${DEFAULT_PLATFORM_NAMESPACE}/minio`]: {
        strategy: "RollingUpdate",
        canaryWeight: 0,
        blueGreenActive: "blue",
        syncStatus: "Synced",
        healthStatus: "Healthy",
        history: [
            {
                revision: 1,
                imageTag: "minio/minio:RELEASE.2024-01-18T22-51-28Z",
                deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
                status: "active",
                commitHash: "55cc23a",
                author: "Drozsdik Ádám",
                strategy: "RollingUpdate"
            }
        ]
    }
};
