import type { ReactNode } from "react";

export type ResilienceScenario = 'baseline' | 'spike' | 'failover';

export type LoadTestJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'UNKNOWN';

export type ChaosExperimentStatus = 'PENDING' | 'RUNNING' | 'RECOVERED' | 'FAILED';

export type NetworkFaultMode = 'normal' | 'latency' | 'fault' | 'unavailable';

export interface ScenarioOption {
    id: ResilienceScenario;
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    accentBorder: string;
    accentBg: string;
    accentText: string;
}

export interface NetworkFaultModeOption {
    mode: NetworkFaultMode;
    title: string;
    description: string;
    icon: ReactNode;
    badgeText: string;
    colorClass: string;
}

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

export interface ProxyStatus {
    available: boolean;
    url: string;
    lastChecked: string;
}

export interface ResilienceOverview {
    proxyStatus: ProxyStatus;
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
