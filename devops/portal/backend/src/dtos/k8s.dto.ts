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

export interface RateLimitResponseDto {
    rps: number;
    burst: number;
}

export interface UpdateHpaDto {
    minReplicas: number;
    maxReplicas: number;
    currentReplicas?: number;
    targetCpuUtil: number;
    currentCpuPercent?: number;
    currentMemoryUsage?: number;
    targetMemoryUtil?: number;
}

export interface VpaOverviewDto {
    name: string;
    updateMode: 'Auto' | 'Off';
    minAllowedCpu?: string;
    minAllowedMemory?: string;
    maxAllowedCpu?: string;
    maxAllowedMemory?: string;
    targetCpu?: string;
    targetMemory?: string;
}

export interface UpdateVpaDto {
    updateMode: 'Auto' | 'Off';
    minAllowedCpu: string;
    minAllowedMemory: string;
    maxAllowedCpu: string;
    maxAllowedMemory: string;
}

export interface K8sEventDto {
    id: string;
    type: 'Normal' | 'Warning';
    reason: string;
    message: string;
    involvedObjectName: string;
    involvedObjectKind: string;
    namespace: string;
    count: number;
    firstTimestamp?: string | undefined;
    lastTimestamp: string;
    sourceComponent?: string | undefined;
}

export interface PodLogsResponseDto {
    podName: string;
    namespace: string;
    containerName: string;
    lines: string[];
    totalLines: number;
    timestamp: string;
}
