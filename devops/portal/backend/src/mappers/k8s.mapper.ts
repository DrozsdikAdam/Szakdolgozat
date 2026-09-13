import type { V1Pod } from "@kubernetes/client-node";
import type { PodInfo } from "../types/k8s.types.js";

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