export type ResilienceScenario = 'baseline' | 'spike' | 'failover';

export type LoadTestJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'UNKNOWN';

export type ChaosExperimentStatus = 'PENDING' | 'RUNNING' | 'RECOVERED' | 'FAILED';

export type NetworkFaultMode = 'normal' | 'latency' | 'fault' | 'unavailable';

export interface LoadTestItem {
    id: string;
    jobName: string;
    scenario: ResilienceScenario;
    threads: number;
    duration: number;
    target: string;
    status: LoadTestJobStatus;
    startTime: string;
    completionTime?: string | undefined;
    logs?: string | undefined;
}

export interface KillPodResult {
    experimentId: string;
    podName: string;
    namespace: string;
    killedAt: string;
    recoveredAt?: string | undefined;
    recoveryTimeSeconds?: number | undefined;
    status: ChaosExperimentStatus;
    message: string;
}

export interface NetworkTestResult {
    mode: NetworkFaultMode;
    statusCode: number;
    responseTimeMs: number;
    success: boolean;
    data?: unknown;
    timestamp: string;
}

export interface ResilienceOverview {
    proxyStatus: {
        available: boolean;
        url: string;
        lastChecked: string;
    };
    activeLoadTests: LoadTestItem[];
    recentLoadTests: LoadTestItem[];
    recentExperiments: KillPodResult[];
    averageRtoSeconds: number;
    totalTestsRun: number;
}

export interface StartLoadTestDto {
    scenario: ResilienceScenario;
    threads?: number | undefined;
    duration?: number | undefined;
    targetHost?: string | undefined;
    targetPort?: number | undefined;
}

export interface LoadTestResponseDto {
    jobName: string;
    scenario: ResilienceScenario;
    status: LoadTestJobStatus;
    message: string;
}

export interface LoadTestDetailDto extends LoadTestItem {
    rawLogs?: string | undefined;
}

export interface KillPodRequestDto {
    namespace: string;
    podName: string;
}

export type KillPodResponseDto = KillPodResult;

export interface NetworkTestRequestDto {
    mode: NetworkFaultMode;
}

export type NetworkTestResponseDto = NetworkTestResult;

export type ResilienceOverviewDto = ResilienceOverview;
