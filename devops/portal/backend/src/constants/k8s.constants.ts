import type { WorkloadHealthDto } from "../dtos/healthcheck.dto.js";
import type { InstanceSize } from "../types/setup.types.js";
import { DEFAULT_APP_NAMESPACE, DEFAULT_PLATFORM_NAMESPACE, DEFAULT_APP_NAME } from "./namespace.constants.js";

export const ARGO_ROLLOUT_CRD = {
    GROUP: "argoproj.io",
    VERSION: "v1alpha1",
    PLURAL: "rollouts"
} as const;

export const HPA_DEFAULTS = {
    DEFAULT_MIN_REPLICAS: 1,
    DEFAULT_MAX_REPLICAS: 10
} as const;

export const K8S_CONTENT_TYPES = {
    MERGE_PATCH: "application/merge-patch+json",
    JSON_PATCH: "application/json-patch+json"
} as const;

export interface InstanceResourceRequirement {
    requests: { cpu: string; memory: string };
    limits: { cpu: string; memory: string };
}

export const INSTANCE_SIZE_MAP: Record<InstanceSize, InstanceResourceRequirement> = {
    nano: { requests: { cpu: "250m", memory: "512Mi" }, limits: { cpu: "500m", memory: "1024Mi" } },
    small: { requests: { cpu: "500m", memory: "1Gi" }, limits: { cpu: "1000m", memory: "2Gi" } },
    medium: { requests: { cpu: "1000m", memory: "2Gi" }, limits: { cpu: "2000m", memory: "4Gi" } },
    large: { requests: { cpu: "2000m", memory: "4Gi" }, limits: { cpu: "4000m", memory: "8Gi" } }
} as const;

export const DEFAULT_INSTANCE_RESOURCES: InstanceResourceRequirement = INSTANCE_SIZE_MAP.small;

export const DEFAULT_WORKLOAD_HEALTH: WorkloadHealthDto[] = [
    {
        name: DEFAULT_APP_NAME,
        namespace: DEFAULT_APP_NAMESPACE,
        containerName: DEFAULT_APP_NAME,
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
        namespace: DEFAULT_PLATFORM_NAMESPACE,
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
        namespace: DEFAULT_PLATFORM_NAMESPACE,
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
        namespace: DEFAULT_PLATFORM_NAMESPACE,
        containerName: 'pgbouncer',
        replicas: { desired: 1, ready: 1, available: 1 },
        restartCount: 0,
        status: 'unconfigured'
    }
];
