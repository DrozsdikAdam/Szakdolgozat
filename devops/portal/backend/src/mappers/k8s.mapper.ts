import type { V1Pod, V1Probe } from "@kubernetes/client-node";
import type { PodInfo } from "../types/k8s.types.js";
import type {
    ProbeDefinition,
    HealthProbeType,
    WorkloadHealthStatus
} from "../dtos/healthcheck.dto.js";

export class K8sMapper {

    toPodInfo(pod: V1Pod): PodInfo {
        const statuses = pod.status?.containerStatuses ?? [];
        const readyDb = statuses.filter(c => c.ready).length;
        const osszesDb = statuses.length;

        return {
            name: pod.metadata?.name ?? "Unknown",
            namespace: pod.metadata?.namespace ?? "Unknown",
            status: pod.status?.phase ?? "Unknown",
            ready: `${readyDb}/${osszesDb}`,
            restarts: statuses.reduce((sum, status) => sum + (status.restartCount ?? 0), 0),
            age: this.calculateAge(pod.metadata?.creationTimestamp),
            ip: pod.status?.podIP ?? "Unknown"
        };
    }

    toPodInfos(pods: V1Pod[]): PodInfo[] {
        return pods.map(pod => this.toPodInfo(pod));
    }

    maskSecretData(data?: Record<string, string>): Record<string, string> {
        if (!data) return {};
        const masked: Record<string, string> = {};
        for (const key of Object.keys(data)) {
            masked[key] = "••••••••";
        }
        return masked;
    }

    toProbeDefinition(p?: V1Probe): ProbeDefinition | undefined {
        if (!p) return undefined;

        let type: HealthProbeType = 'httpGet';
        let httpPath = p.httpGet?.path;
        let port: number | string | undefined = p.httpGet?.port as any;
        let command = p.exec?.command;

        if (p.tcpSocket) {
            type = 'tcpSocket';
            port = p.tcpSocket.port as any;
        } else if (p.exec) {
            type = 'exec';
        }

        return {
            enabled: true,
            type,
            httpPath,
            port,
            command,
            initialDelaySeconds: p.initialDelaySeconds,
            periodSeconds: p.periodSeconds,
            timeoutSeconds: p.timeoutSeconds,
            successThreshold: p.successThreshold,
            failureThreshold: p.failureThreshold
        };
    }

    toK8sProbe(def?: ProbeDefinition): V1Probe | undefined {
        if (!def || !def.enabled) return undefined;

        const probe: V1Probe = {
            initialDelaySeconds: def.initialDelaySeconds ?? 5,
            periodSeconds: def.periodSeconds ?? 10,
            timeoutSeconds: def.timeoutSeconds ?? 2,
            successThreshold: def.successThreshold ?? 1,
            failureThreshold: def.failureThreshold ?? 3
        };

        if (def.type === 'httpGet') {
            probe.httpGet = {
                path: def.httpPath || '/healthz',
                port: (typeof def.port === 'number' || typeof def.port === 'string') ? (def.port as any) : 8080
            };
        } else if (def.type === 'tcpSocket') {
            probe.tcpSocket = {
                port: (typeof def.port === 'number' || typeof def.port === 'string') ? (def.port as any) : 8080
            };
        } else if (def.type === 'exec' && def.command && def.command.length > 0) {
            probe.exec = {
                command: def.command
            };
        }

        return probe;
    }

    calculateHealthStatus(desired: number, ready: number, hasProbes: boolean): WorkloadHealthStatus {
        if (desired > 0 && ready === 0) {
            return 'critical';
        }
        if (ready < desired) {
            return 'warning';
        }
        if (!hasProbes) {
            return 'unconfigured';
        }
        return 'healthy';
    }

    private calculateAge(creationTimestamp?: Date | string): string {
        if (!creationTimestamp) return "Unknown";
        const date = typeof creationTimestamp === "string"
            ? new Date(creationTimestamp)
            : creationTimestamp;

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Less than 1 min";
        if (diffMins < 60) return `${diffMins} min`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr`;

        return `${Math.floor(diffMins / 1440)} days`;
    }

}