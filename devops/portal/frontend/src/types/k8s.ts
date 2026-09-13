export interface PodInfo {
    name: string,
    status: string,
    ready: string,
    restarts: number,
    age: string
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
