import type { DeploymentRevision, DeploymentStrategy, GitOpsHealthStatus, GitOpsSyncStatus, GitRepoConfig } from "../types/deployment.dto.js"

export interface WorkloadDeploymentDto {
    name: string
    namespace: string
    currentImage: string
    strategy: DeploymentStrategy
    syncStatus: GitOpsSyncStatus
    healthStatus: GitOpsHealthStatus
    replicas: { desired: number; current: number; updated: number; available: number }
    canaryWeight?: number | undefined
    blueGreenActive?: 'blue' | 'green' | undefined
    history: DeploymentRevision[]
}

export interface DeploymentsOverviewDto {
    gitRepo: GitRepoConfig
    workloads: WorkloadDeploymentDto[]
}

export interface UpdateDeploymentStrategyDto {
    deploymentName: string
    namespace: string
    strategy: DeploymentStrategy
    canaryWeight?: number | undefined
    promoteBlueGreen?: boolean | undefined
}

export interface RollbackDeploymentDto {
    deploymentName: string
    namespace: string
    targetRevision: number
}