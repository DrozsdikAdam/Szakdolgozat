import type { WorkloadHealthDto } from "../dtos/healthcheck.dto.js";

export const DEFAULT_WORKLOAD_HEALTH: WorkloadHealthDto[] = [
    {
        name: 'mes-backend',
        namespace: 'app-mes',
        containerName: 'mes-backend',
        replicas: { desired: 1, ready: 1, available: 1 },
        restartCount: 0,
        startupProbe: {
            enabled: true,
            type: 'httpGet',
            httpPath: '/actuator/health/liveness',
            port: 8080,
            initialDelaySeconds: 15,
            periodSeconds: 10,
            timeoutSeconds: 3,
            successThreshold: 1,
            failureThreshold: 6
        },
        livenessProbe: {
            enabled: true,
            type: 'httpGet',
            httpPath: '/actuator/health/liveness',
            port: 8080,
            initialDelaySeconds: 10,
            periodSeconds: 10,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3
        },
        readinessProbe: {
            enabled: true,
            type: 'httpGet',
            httpPath: '/actuator/health/readiness',
            port: 8080,
            initialDelaySeconds: 5,
            periodSeconds: 5,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 2
        },
        status: 'healthy'
    },
    {
        name: 'portal-backend',
        namespace: 'platform-infra',
        containerName: 'portal-backend',
        replicas: { desired: 1, ready: 1, available: 1 },
        restartCount: 0,
        livenessProbe: {
            enabled: true,
            type: 'httpGet',
            httpPath: '/healthz',
            port: 3000,
            initialDelaySeconds: 5,
            periodSeconds: 10,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3
        },
        readinessProbe: {
            enabled: true,
            type: 'httpGet',
            httpPath: '/healthz',
            port: 3000,
            initialDelaySeconds: 2,
            periodSeconds: 5,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 2
        },
        status: 'healthy'
    },
    {
        name: 'haproxy',
        namespace: 'platform-infra',
        containerName: 'haproxy',
        replicas: { desired: 1, ready: 1, available: 1 },
        restartCount: 0,
        livenessProbe: {
            enabled: true,
            type: 'tcpSocket',
            port: 1433,
            initialDelaySeconds: 5,
            periodSeconds: 15,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3
        },
        status: 'healthy'
    },
    {
        name: 'pgbouncer',
        namespace: 'platform-infra',
        containerName: 'pgbouncer',
        replicas: { desired: 1, ready: 1, available: 1 },
        restartCount: 0,
        status: 'unconfigured'
    }
];
