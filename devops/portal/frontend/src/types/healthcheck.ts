export type ProbeType = 'httpGet' | 'tcpSocket' | 'exec';

export type HealthCheckType = 'startup' | 'liveness' | 'readiness';

export type ProbeStatus = 'healthy' | 'warning' | 'critical' | 'unconfigured';

export interface ProbeDefinition {
    enabled: boolean
    type: ProbeType
    httpPath?: string
    port?: number | string
    command?: string[]
    initialDelaySeconds?: number
    periodSeconds?: number
    timeoutSeconds?: number
    successThreshold?: number
    failureThreshold?: number
}

export interface WorkloadHealthDto {
    name: string
    namespace: string
    containerName?: string
    replicas: { desired: number, ready: number, available: number }
    restartCount: number
    startupProbe?: ProbeDefinition
    livenessProbe?: ProbeDefinition
    readinessProbe?: ProbeDefinition
    status: ProbeStatus
}

export interface UpdateProbeDto {
    deploymentName: string
    namespace: string
    containerName?: string
    probeKind: HealthCheckType
    probe: ProbeDefinition
}

export interface ProbeTestResultDto {
    success: boolean
    statusCode?: number
    responseTimeMs: number
    message: string
    testedAt: string
}
