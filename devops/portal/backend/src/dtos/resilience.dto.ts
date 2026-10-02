import type {
    ResilienceScenario,
    LoadTestJobStatus,
    LoadTestItem,
    KillPodResult,
    NetworkFaultMode,
    NetworkTestResult,
    ResilienceOverview
} from "../types/resilience.types.js";

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
