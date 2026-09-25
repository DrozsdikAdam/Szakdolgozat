export type PipelineStatus = 'success' | 'in_progress' | 'waiting_approval' | 'cancelled' | 'failed'
export type PipelineStageStatus = 'success' | 'running' | 'failed' | 'pending' | 'skipped'

export interface PipelineStage {
    id: string
    name: string
    status: PipelineStageStatus
    durationSeconds: number
    startedAt?: string
    completedAt?: string
}

export interface PipelineRun {
    id: string
    runNumber: number
    branch: string
    commitHash: string
    commitMessage: string
    author: string
    status: PipelineStatus
    stages: PipelineStage[]
    workflowUrl: string
    createdAt: string
    updatedAt: string
}

export interface ManualApprovalRequest {
    runId: string
    decision: 'approved' | 'rejected'
    approver: string
    comment?: string
}

export interface GitOpsDriftReport {
    isSynced: boolean
    syncStatus: 'Synced' | 'OutOfSync' | 'Unknown'
    targetRevision: string
    outOfSyncResources: Array<{
        kind: string
        name: string
        namespace: string
        status: string
    }>
}

export interface RolloutActionRequest {
    rolloutName: string
    namespace: string
    action: 'promote' | 'pause' | 'resume' | 'abort' | 'rollback'
    full?: boolean
}

export interface PipelineConfig {
    envPath: string;
    gitRepoUrl: string;
    repoOwner: string;
    repoName: string;
    stagingBranch: string;
    productionBranch: string;
    appNamespace: string;
    stagingUrl: string;
    targetUrl: string;
    defaultStrategy: 'canary' | 'bluegreen';
    githubToken: string;
}