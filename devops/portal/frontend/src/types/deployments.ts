export type DeploymentStrategy = 'RollingUpdate' | 'BlueGreen' | 'Canary'

export type GitOpsSyncStatus = 'Synced' | 'OutOfSync' | 'Syncing' | 'Degraded'

export type GitOpsHealthStatus = 'Healthy' | 'Progressing' | 'Degraded' | 'Suspended'

export interface GitCommitInfo {
    hash: string;
    message: string;
    author: string;
    timestamp: string;
}

export interface GitRepoConfig {
    repoUrl: string,
    branch: string,
    path: string,
    syncStatus: GitOpsSyncStatus,
    autoSync: boolean,
    selfHeal: boolean,
    lastSyncTime: string,
    lastCommit: GitCommitInfo
}

export interface DeploymentRevision {
    revision: number,
    imageTag: string,
    deployedAt: string,
    status: 'active' | 'superseded' | 'canary',
    commitHash: string,
    author: string,
    strategy: DeploymentStrategy
}

export interface WorkloadDeploymentDto {
    name: string
    namespace: string
    currentImage: string
    strategy: DeploymentStrategy
    syncStatus: GitOpsSyncStatus
    healthStatus: GitOpsHealthStatus
    replicas: { desired: number; current: number; updated: number; available: number }
    canaryWeight?: number
    blueGreenActive?: 'blue' | 'green'
    history: DeploymentRevision[]
}

export interface DeploymentsOverviewDto {
    gitRepo: GitRepoConfig,
    workloads: WorkloadDeploymentDto[]
}

export interface UpdateDeploymentStrategyDto {
    deploymentName: string,
    namespace: string,
    strategy: DeploymentStrategy,
    canaryWeight?: number,
    promoteBlueGreen?: boolean
}

export interface RollbackDeploymentDto {
    deploymentName: string,
    namespace: string,
    targetRevision: number
}