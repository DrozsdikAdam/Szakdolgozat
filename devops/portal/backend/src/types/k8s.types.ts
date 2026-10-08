import type {
    DeploymentStrategy,
    GitOpsSyncStatus,
    GitOpsHealthStatus,
    DeploymentRevision
} from "./deployment.dto.js";

export type PodInfo = {
    name: string;
    namespace: string;
    status: string;
    ready: string;
    restarts: number;
    age: string;
    ip?: string;
};

export interface WorkloadBaseline {
    cpuBase: number;
    cpuLimit: number;
    memBase: number;
    memLimit: number;
}

export interface WorkloadMetadata {
    strategy: DeploymentStrategy;
    canaryWeight: number;
    blueGreenActive: 'blue' | 'green';
    syncStatus: GitOpsSyncStatus;
    healthStatus: GitOpsHealthStatus;
    history: DeploymentRevision[];
}