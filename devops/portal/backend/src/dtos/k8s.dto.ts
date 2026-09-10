import type { PodInfo } from "../types/k8s.types.js";

export interface ClusterOverviewDto {
    platformPods: PodInfo[];
    appPods: PodInfo[];
    timestamp: string;
}

export interface UpdateRateLimitDto {
    rps: number;
    burst?: number;
}

export interface UpdateHpaDto {
    minReplicas: number;
    maxReplicas: number;
    currentReplicas: number;
    targetCpuUtil: number;
    currentCpuPercent?: number;
    currentMemoryUsage?: number;
    targetMemoryUtil?: number;
}
