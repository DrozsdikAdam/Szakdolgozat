export type TelemetryTimeRange = '15m' | '1h' | '6h' | '24h'
export type RiskLevel = 'Low' | 'Medium' | 'High'
export type NodeStatus = 'Healthy' | 'Warning' | 'Critical'
export type Category = 'Cluster' | 'Network' | 'Database'
export type SourceStatus = 'Online' | 'Offline' | 'Degraded'

export interface TelemetrySourceStatus {
    name: string
    status: SourceStatus
    url: string
    lastScrapeTime: string
    scrapeIntervalSeconds: number
    activeTargetCount: number
}

export interface GoldenSignalsDto {
    rps: number
    latencyP50: number
    latencyP95: number
    latencyP99: number
    errorRatePercent: number
    saturationPercent: number
}

export interface ClusterResourceMetricsDto {
    cpu: {
        usage: number
        requests: number
        limit: number
        usagePercent: number
    }
    memory: {
        usage: number
        requests: number
        limit: number
        usagePercent: number
    }
    network: {
        inbound: number
        outbound: number
    }
    nodes: {
        total: number
        active: number
    }
}

export interface WorkloadMetricDto {
    name: string
    namespace: string
    cpuUsedMilli: number
    cpuLimitMilli: number
    cpuThrottlingEvents: number
    memoryUsedMb: number
    memoryLimitMb: number
    oomRisk: RiskLevel
    restarts: number
    status: NodeStatus
}

export interface GrafanaDashboardDto {
    id: string
    title: string
    description: string
    category: Category
    embedUrl: string
    externalUrl: string
}

export interface TelemetryOverViewDto {
    timeStamp: string
    timeRange: TelemetryTimeRange
    sources: Record<string, TelemetrySourceStatus>
    signals: GoldenSignalsDto
    cluster: ClusterResourceMetricsDto
    workloads: WorkloadMetricDto[]
    dashboards: GrafanaDashboardDto[]
}