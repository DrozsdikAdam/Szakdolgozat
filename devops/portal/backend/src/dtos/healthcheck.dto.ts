export type HealthProbeType = 'httpGet' | 'tcpSocket' | 'exec';
export type ProbeKind = 'startup' | 'liveness' | 'readiness';
export type WorkloadHealthStatus = 'healthy' | 'warning' | 'critical' | 'unconfigured';

export interface ProbeDefinition {
    enabled: boolean;
    type: HealthProbeType;
    httpPath?: string | undefined;
    port?: number | string | undefined;
    command?: string[] | undefined;
    initialDelaySeconds?: number | undefined;
    periodSeconds?: number | undefined;
    timeoutSeconds?: number | undefined;
    successThreshold?: number | undefined;
    failureThreshold?: number | undefined;
}

export interface WorkloadHealthDto {
    name: string;
    namespace: string;
    containerName?: string | undefined;
    replicas: { desired: number; ready: number; available: number };
    restartCount: number;
    startupProbe?: ProbeDefinition | undefined;
    livenessProbe?: ProbeDefinition | undefined;
    readinessProbe?: ProbeDefinition | undefined;
    status: WorkloadHealthStatus;
}

export interface UpdateProbeDto {
    namespace: string;
    deploymentName: string;
    containerName?: string | undefined;
    probeKind: ProbeKind;
    probe: ProbeDefinition;
}

export interface ProbeTestResultDto {
    success: boolean;
    statusCode?: number | undefined;
    responseTimeMs: number;
    message: string;
    testedAt: string;
}