export interface PodInfo {
    name: string,
    namespace?: string,
    status: string,
    ready: string,
    restarts: number,
    age: string,
    ip?: string
}

export interface ClusterOverviewDto {
    platformPods: PodInfo[],
    appPods: PodInfo[],
    timestamp: string
}

export interface UpdateRateLimitDto {
    rps: number,
    burst?: number
}

export interface RateLimitResponseDto {
    rps: number;
    burst: number;
    isConfigured?: boolean;
}

export interface UpdateHpaDto {
    minReplicas: number,
    maxReplicas: number,
    currentReplicas: number,
    targetCpuUtil: number,
    currentCpuPercent?: number
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
    firstTimestamp?: string;
    lastTimestamp: string;
    sourceComponent?: string;
}

export interface PodLogsResponseDto {
    podName: string;
    namespace: string;
    containerName: string;
    lines: string[];
    totalLines: number;
    timestamp: string;
}
