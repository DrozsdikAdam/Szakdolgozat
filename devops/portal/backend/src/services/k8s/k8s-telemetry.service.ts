import { K8sClientService } from "./k8s-client.service.js";
import {
    DEFAULT_TELEMETRY_CONFIG,
    DEFAULT_GRAFANA_DASHBOARD,
    TIME_RANGE_MULTIPLIERS,
    TIME_RANGE_PROMQL_WINDOWS
} from "../../constants/k8s-telemetry.constants.js";
import { DEFAULT_PLATFORM_NAMESPACE } from "../../constants/namespace.constants.js";
import type {
    TelemetryOverViewDto,
    TelemetryTimeRange,
    TelemetrySourceStatus,
    GoldenSignalsDto,
    ClusterResourceMetricsDto,
    WorkloadMetricDto,
    GrafanaDashboardDto,
    RiskLevel,
    NodeStatus
} from "../../dtos/telemetry.dto.js";
import type { WorkloadBaseline } from "../../types/k8s.types.js";

const WORKLOAD_BASELINES: Record<string, WorkloadBaseline> = {
    haproxy: { cpuBase: 25, cpuLimit: 300, memBase: 64, memLimit: 256 },
    minio: { cpuBase: 45, cpuLimit: 500, memBase: 145, memLimit: 512 },
    mssql: { cpuBase: 85, cpuLimit: 1000, memBase: 420, memLimit: 1024 },
    oracle: { cpuBase: 95, cpuLimit: 1000, memBase: 480, memLimit: 1024 },
    pgbouncer: { cpuBase: 30, cpuLimit: 300, memBase: 72, memLimit: 256 }
};

export class K8sTelemetryService {
    private client: K8sClientService;
    private prometheusUrl: string;
    private grafanaUrl: string;
    private grafanaPublicUrl: string;
    private scrapeIntervalSeconds: number;

    constructor(client?: K8sClientService) {
        this.client = client || K8sClientService.getInstance();
        this.prometheusUrl = process.env["PROMETHEUS_URL"] || DEFAULT_TELEMETRY_CONFIG.prometheusUrl;
        this.grafanaUrl = process.env["GRAFANA_URL"] || DEFAULT_TELEMETRY_CONFIG.grafanaUrl;
        this.grafanaPublicUrl = process.env["GRAFANA_PUBLIC_URL"] || "http://localhost:3001";
        this.scrapeIntervalSeconds = DEFAULT_TELEMETRY_CONFIG.scrapeIntervalSeconds;
    }

    private queryPrometheusScalar = async (promql: string): Promise<number | null> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        try {
            const baseUrl = this.prometheusUrl.replace(/\/+$/, "");
            const response = await fetch(`${baseUrl}/api/v1/query?query=${encodeURIComponent(promql)}`, {
                method: "GET",
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) return null;
            const payload = await response.json() as {
                status?: string;
                data?: { result?: Array<{ value?: [number, string] }> };
            };
            if (payload?.status !== "success") return null;

            const rawVal = payload.data?.result?.[0]?.value?.[1];
            if (rawVal === undefined || rawVal === null) return null;

            const parsed = Number(rawVal);
            return Number.isFinite(parsed) ? parsed : null;
        } catch {
            clearTimeout(timeoutId);
            return null;
        }
    };

    public checkSourcesHealth = async (): Promise<Record<string, TelemetrySourceStatus>> => {
        const checkEndpoint = async (name: string, url: string, probePath: string): Promise<TelemetrySourceStatus> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);

            try {
                const targetUrl = `${url.replace(/\/+$/, "")}${probePath}`;
                const response = await fetch(targetUrl, {
                    method: "GET",
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const isOk = response.status >= 200 && response.status < 400;
                return {
                    name,
                    status: isOk ? "Online" : "Degraded",
                    url,
                    lastScrapeTime: new Date().toISOString(),
                    scrapeIntervalSeconds: this.scrapeIntervalSeconds,
                    activeTargetCount: isOk ? 1 : 0
                };
            } catch {
                clearTimeout(timeoutId);
                return {
                    name,
                    status: "Offline",
                    url,
                    lastScrapeTime: new Date().toISOString(),
                    scrapeIntervalSeconds: this.scrapeIntervalSeconds,
                    activeTargetCount: 0
                };
            }
        };

        const [prometheus, grafana, liveTargets] = await Promise.all([
            checkEndpoint("Prometheus", this.prometheusUrl, "/-/healthy"),
            checkEndpoint("Grafana", this.grafanaUrl, "/api/health"),
            this.queryPrometheusScalar("count(up == 1)")
        ]);

        if (prometheus.status === "Online" && liveTargets !== null) {
            prometheus.activeTargetCount = Math.max(0, Math.round(liveTargets));
        }

        return {
            prometheus,
            grafana
        };
    };

    private parseCpuMilli = (raw?: string): number => {
        if (!raw) return 0;
        const val = String(raw).trim();
        if (val.endsWith("n")) return Math.max(1, Math.round(Number(val.slice(0, -1)) / 1_000_000));
        if (val.endsWith("u")) return Math.max(1, Math.round(Number(val.slice(0, -1)) / 1_000));
        if (val.endsWith("m")) return Math.round(Number(val.slice(0, -1)) || 0);
        const cores = Number(val);
        return Number.isFinite(cores) ? Math.round(cores * 1000) : 0;
    };

    private parseMemoryMb = (raw?: string): number => {
        if (!raw) return 0;
        const val = String(raw).trim();
        const num = parseFloat(val);
        if (!Number.isFinite(num)) return 0;
        if (val.endsWith("Ki")) return Math.max(1, Math.round(num / 1024));
        if (val.endsWith("Mi")) return Math.round(num);
        if (val.endsWith("Gi")) return Math.round(num * 1024);
        if (val.endsWith("K") || val.endsWith("k")) return Math.max(1, Math.round(num / 1000));
        if (val.endsWith("M")) return Math.round(num);
        if (val.endsWith("G")) return Math.round(num * 1000);
        return Math.max(1, Math.round(num / (1024 * 1024)));
    };

    public getOverview = async (timeRange?: TelemetryTimeRange): Promise<TelemetryOverViewDto> => {
        const range: TelemetryTimeRange = timeRange || "1h";
        const rangeConfig = TIME_RANGE_MULTIPLIERS[range] || { multiplier: 1.0, dataPoints: 30 };
        const multiplier = rangeConfig.multiplier;
        const promqlWindow = TIME_RANGE_PROMQL_WINDOWS[range] || "5m";

        const [sources, workloadData, nodeStats, promMetrics] = await Promise.all([
            this.checkSourcesHealth(),
            this.collectWorkloadMetrics(multiplier),
            this.collectNodeStats(),
            this.collectPrometheusMetrics(promqlWindow)
        ]);

        const cluster = this.calculateClusterMetrics(workloadData.workloads, workloadData.totalRequests, nodeStats, promMetrics);
        const signals = this.calculateGoldenSignals(promMetrics, cluster);
        const dashboards = this.getDashboards();

        return {
            timeStamp: new Date().toISOString(),
            timeRange: range,
            sources,
            signals,
            cluster,
            workloads: workloadData.workloads,
            dashboards
        };
    };

    public getWorkloadMetrics = async (namespace?: string): Promise<WorkloadMetricDto[]> => {
        const overview = await this.getOverview("1h");
        if (!namespace || namespace === "all") {
            return overview.workloads;
        }
        return overview.workloads.filter((w) => w.namespace === namespace);
    };

    public getDashboards = (): GrafanaDashboardDto[] => {
        return DEFAULT_GRAFANA_DASHBOARD.map((d) => ({
            ...d,
            embedUrl: d.embedUrl.replace(/http:\/\/localhost:\d+/, this.grafanaPublicUrl),
            externalUrl: d.externalUrl.replace(/http:\/\/localhost:\d+/, this.grafanaPublicUrl)
        }));
    };

    private collectNodeStats = async (): Promise<{ total: number; active: number }> => {
        try {
            const nodeList = await this.client.coreApi.listNode();
            const items = nodeList.items || [];
            if (items.length === 0) return { total: 1, active: 1 };
            const active = items.filter(n =>
                (n.status?.conditions || []).some(c => c.type === "Ready" && c.status === "True")
            ).length;
            return { total: items.length, active: Math.max(active, items.length > 0 ? 1 : 0) };
        } catch {
            return { total: 1, active: 1 };
        }
    };

    private collectWorkloadMetrics = async (
        multiplier: number
    ): Promise<{ workloads: WorkloadMetricDto[]; totalRequests: { cpu: number; mem: number } }> => {
        const workloads: WorkloadMetricDto[] = [];
        const namespaces = K8sClientService.resolveNamespaces();
        const customApi = this.client.customObjectsApi as any;
        let totalCpuReq = 0;
        let totalMemReq = 0;

        try {
            const perNs = await Promise.all(
                namespaces.map(async (ns) => {
                    const nsWorkloads: WorkloadMetricDto[] = [];
                    let nsCpuReq = 0;
                    let nsMemReq = 0;

                    try {
                        const [podListRes, podMetricsRes] = await Promise.allSettled([
                            this.client.coreApi.listNamespacedPod({ namespace: ns }),
                            customApi.listNamespacedCustomObject({
                                group: "metrics.k8s.io",
                                version: "v1beta1",
                                namespace: ns,
                                plural: "pods"
                            })
                        ]);

                        const podItems = podListRes.status === "fulfilled" ? (podListRes.value.items || []) : [];
                        const metricsItems: any[] = podMetricsRes.status === "fulfilled"
                            ? (podMetricsRes.value?.items || podMetricsRes.value?.body?.items || [])
                            : [];

                        const podUsageMap = new Map<string, { cpu: number; mem: number }>();
                        for (const m of metricsItems) {
                            const mName = m?.metadata?.name;
                            if (!mName) continue;
                            let cpu = 0;
                            let mem = 0;
                            for (const c of m?.containers || []) {
                                cpu += this.parseCpuMilli(c?.usage?.cpu);
                                mem += this.parseMemoryMb(c?.usage?.memory);
                            }
                            podUsageMap.set(mName, { cpu, mem });
                        }

                        const grouped = new Map<string, {
                            pods: any[];
                            cpuUsed: number;
                            memUsed: number;
                            cpuLimit: number;
                            memLimit: number;
                            restarts: number;
                            hasLiveMetrics: boolean;
                            allRunning: boolean;
                        }>();

                        for (const pod of podItems) {
                            if (pod.status?.phase === "Succeeded") continue;
                            const podName = pod.metadata?.name || "";
                            const workloadName = this.extractDeploymentName(pod);
                            const liveUsage = podUsageMap.get(podName);

                            let podCpuLimit = 0;
                            let podMemLimit = 0;
                            for (const c of pod.spec?.containers || []) {
                                podCpuLimit += this.parseCpuMilli(c.resources?.limits?.cpu) || this.parseCpuMilli(c.resources?.requests?.cpu);
                                podMemLimit += this.parseMemoryMb(c.resources?.limits?.memory) || this.parseMemoryMb(c.resources?.requests?.memory);
                                nsCpuReq += this.parseCpuMilli(c.resources?.requests?.cpu) || 100;
                                nsMemReq += this.parseMemoryMb(c.resources?.requests?.memory) || 128;
                            }

                            const restarts = (pod.status?.containerStatuses || [])
                                .reduce((sum: number, cs: any) => sum + (cs.restartCount || 0), 0);

                            const existing = grouped.get(workloadName) || {
                                pods: [],
                                cpuUsed: 0,
                                memUsed: 0,
                                cpuLimit: 0,
                                memLimit: 0,
                                restarts: 0,
                                hasLiveMetrics: false,
                                allRunning: true
                            };

                            existing.pods.push(pod);
                            if (liveUsage) {
                                existing.cpuUsed += liveUsage.cpu;
                                existing.memUsed += liveUsage.mem;
                                existing.hasLiveMetrics = true;
                            }
                            existing.cpuLimit += podCpuLimit || 500;
                            existing.memLimit += podMemLimit || 512;
                            existing.restarts += restarts;
                            if (pod.status?.phase !== "Running") {
                                existing.allRunning = false;
                            }
                            grouped.set(workloadName, existing);
                        }

                        for (const [depName, agg] of grouped.entries()) {
                            const baseline = WORKLOAD_BASELINES[depName] || {
                                cpuBase: 25,
                                cpuLimit: 400,
                                memBase: 90,
                                memLimit: 512
                            };

                            const cpuUsed = agg.hasLiveMetrics
                                ? agg.cpuUsed
                                : Math.round(baseline.cpuBase * multiplier * agg.pods.length);
                            const memUsed = agg.hasLiveMetrics
                                ? agg.memUsed
                                : Math.round(baseline.memBase * multiplier * agg.pods.length);
                            const cpuLimit = agg.cpuLimit > 0 ? agg.cpuLimit : baseline.cpuLimit;
                            const memLimit = agg.memLimit > 0 ? agg.memLimit : baseline.memLimit;
                            const memRatio = memLimit > 0 ? memUsed / memLimit : 0;

                            let oomRisk: RiskLevel = "Low";
                            if (memRatio > 0.85) oomRisk = "High";
                            else if (memRatio > 0.65) oomRisk = "Medium";

                            let status: NodeStatus = "Healthy";
                            if (!agg.allRunning) status = "Critical";
                            else if (oomRisk === "High" || agg.restarts > 3) status = "Warning";

                            nsWorkloads.push({
                                name: depName,
                                namespace: ns,
                                cpuUsedMilli: cpuUsed,
                                cpuLimitMilli: cpuLimit,
                                cpuThrottlingEvents: cpuLimit > 0 && cpuUsed / cpuLimit > 0.85 ? 2 : 0,
                                memoryUsedMb: memUsed,
                                memoryLimitMb: memLimit,
                                oomRisk,
                                restarts: agg.restarts,
                                status
                            });
                        }
                    } catch (nsErr) {
                        console.warn(`[K8sTelemetryService] Nem sikerült a(z) '${ns}' podjait lekérni:`, (nsErr as any)?.message || nsErr);
                    }

                    return { nsWorkloads, nsCpuReq, nsMemReq };
                })
            );

            for (const entry of perNs) {
                workloads.push(...entry.nsWorkloads);
                totalCpuReq += entry.nsCpuReq;
                totalMemReq += entry.nsMemReq;
            }
        } catch (err) {
            console.warn("[K8sTelemetryService] Hiba a podok lekérésekor:", (err as any)?.message || err);
        }

        return {
            workloads,
            totalRequests: { cpu: totalCpuReq, mem: totalMemReq }
        };
    };

    private collectPrometheusMetrics = async (rateWindow: string): Promise<{
        rps: number;
        latencyP50: number;
        latencyP95: number;
        latencyP99: number;
        errorRatePercent: number;
        inboundKbPerSec: number;
        outboundKbPerSec: number;
    }> => {
        const [
            rpsRaw,
            p50Raw,
            p95Raw,
            p99Raw,
            errRaw,
            inboundRaw,
            outboundRaw
        ] = await Promise.all([
            this.queryPrometheusScalar(
                `sum(rate(nginx_ingress_controller_requests[${rateWindow}])) or sum(rate(nginx_ingress_controller_nginx_process_requests_total[${rateWindow}]))`
            ),
            this.queryPrometheusScalar(
                `histogram_quantile(0.50, sum(rate(nginx_ingress_controller_request_duration_seconds_bucket[${rateWindow}])) by (le)) * 1000`
            ),
            this.queryPrometheusScalar(
                `histogram_quantile(0.95, sum(rate(nginx_ingress_controller_request_duration_seconds_bucket[${rateWindow}])) by (le)) * 1000`
            ),
            this.queryPrometheusScalar(
                `histogram_quantile(0.99, sum(rate(nginx_ingress_controller_request_duration_seconds_bucket[${rateWindow}])) by (le)) * 1000`
            ),
            this.queryPrometheusScalar(
                `sum(rate(nginx_ingress_controller_requests{status=~"5.."}[${rateWindow}])) / sum(rate(nginx_ingress_controller_requests[${rateWindow}])) * 100`
            ),
            this.queryPrometheusScalar(
                `sum(rate(container_network_receive_bytes_total{namespace=~"ingress-nginx|platform-infra|app-mes"}[${rateWindow}])) / 1024`
            ),
            this.queryPrometheusScalar(
                `sum(rate(container_network_transmit_bytes_total{namespace=~"ingress-nginx|platform-infra|app-mes"}[${rateWindow}])) / 1024`
            )
        ]);

        const formatRps = (raw: number | null): number => {
            if (raw === null || raw <= 0) return 0;
            if (raw < 0.01) return Number(raw.toFixed(3));
            return raw < 10 ? Number(raw.toFixed(2)) : Number(raw.toFixed(1));
        };
        const formatMs = (raw: number | null): number => {
            if (raw === null || raw <= 0) return 0;
            return Number(raw.toFixed(1));
        };
        const formatKb = (raw: number | null): number => {
            if (raw === null || raw <= 0) return 0;
            return raw < 10 ? Number(raw.toFixed(1)) : Math.round(raw);
        };

        return {
            rps: formatRps(rpsRaw),
            latencyP50: formatMs(p50Raw),
            latencyP95: formatMs(p95Raw),
            latencyP99: formatMs(p99Raw),
            errorRatePercent: errRaw !== null && errRaw > 0 ? Number(Math.min(100, errRaw).toFixed(2)) : 0,
            inboundKbPerSec: formatKb(inboundRaw),
            outboundKbPerSec: formatKb(outboundRaw)
        };
    };

    private calculateClusterMetrics = (
        workloads: WorkloadMetricDto[],
        totalRequests?: { cpu: number; mem: number },
        nodeStats?: { total: number; active: number },
        promMetrics?: { inboundKbPerSec: number; outboundKbPerSec: number }
    ): ClusterResourceMetricsDto => {
        let totalCpuUsed = 0;
        let totalCpuLimit = 0;
        let totalMemUsed = 0;
        let totalMemLimit = 0;

        for (const w of workloads) {
            totalCpuUsed += w.cpuUsedMilli;
            totalCpuLimit += w.cpuLimitMilli;
            totalMemUsed += w.memoryUsedMb;
            totalMemLimit += w.memoryLimitMb;
        }

        const totalCpuReq = totalRequests?.cpu || Math.round(totalCpuLimit * 0.6);
        const totalMemReq = totalRequests?.mem || Math.round(totalMemLimit * 0.7);

        const cpuUsagePercent = totalCpuLimit > 0 ? Math.round((totalCpuUsed / totalCpuLimit) * 100) : 0;
        const memUsagePercent = totalMemLimit > 0 ? Math.round((totalMemUsed / totalMemLimit) * 100) : 0;

        return {
            cpu: {
                usage: totalCpuUsed,
                requests: totalCpuReq,
                limit: totalCpuLimit,
                usagePercent: cpuUsagePercent
            },
            memory: {
                usage: totalMemUsed,
                requests: totalMemReq,
                limit: totalMemLimit,
                usagePercent: memUsagePercent
            },
            network: {
                inbound: promMetrics?.inboundKbPerSec ?? 0,
                outbound: promMetrics?.outboundKbPerSec ?? 0
            },
            nodes: nodeStats || {
                total: 1,
                active: 1
            }
        };
    };

    private calculateGoldenSignals = (
        promMetrics: {
            rps: number;
            latencyP50: number;
            latencyP95: number;
            latencyP99: number;
            errorRatePercent: number;
        },
        cluster: ClusterResourceMetricsDto
    ): GoldenSignalsDto => {
        const saturationPercent = Math.round((cluster.cpu.usagePercent + cluster.memory.usagePercent) / 2);

        return {
            rps: promMetrics.rps,
            latencyP50: promMetrics.latencyP50,
            latencyP95: promMetrics.latencyP95,
            latencyP99: promMetrics.latencyP99,
            errorRatePercent: promMetrics.errorRatePercent,
            saturationPercent
        };
    };

    private extractDeploymentName = (podOrName: any): string => {
        if (typeof podOrName === "object" && podOrName !== null) {
            const ownerRef = podOrName.metadata?.ownerReferences?.[0];
            if (ownerRef?.kind === "StatefulSet" && ownerRef.name) {
                return ownerRef.name;
            }
            if (ownerRef?.kind === "ReplicaSet" && ownerRef.name) {
                return ownerRef.name.replace(/-[a-f0-9]{6,10}$/, "");
            }
            const podName = podOrName.metadata?.name || "";
            return this.extractDeploymentName(podName);
        }

        const podName = String(podOrName || "");
        if (/-\d+$/.test(podName)) {
            return podName.replace(/-\d+$/, "");
        }
        return podName
            .replace(/-[a-f0-9]{6,10}-[a-z0-9]{5}$/, "")
            .replace(/-[a-z0-9]{5}$/, "");
    };

    private getFallbackWorkloads = (multiplier: number): WorkloadMetricDto[] => {
        return Object.entries(WORKLOAD_BASELINES).map(([name, base]) => {
            const cpuUsed = Math.round(base.cpuBase * multiplier);
            const memUsed = Math.round(base.memBase * multiplier);
            const memRatio = memUsed / base.memLimit;

            let oomRisk: RiskLevel = "Low";
            if (memRatio > 0.85) oomRisk = "High";
            else if (memRatio > 0.65) oomRisk = "Medium";

            return {
                name,
                namespace: DEFAULT_PLATFORM_NAMESPACE,
                cpuUsedMilli: cpuUsed,
                cpuLimitMilli: base.cpuLimit,
                cpuThrottlingEvents: multiplier > 1.15 ? 1 : 0,
                memoryUsedMb: memUsed,
                memoryLimitMb: base.memLimit,
                oomRisk,
                restarts: 0,
                status: "Healthy"
            };
        });
    };
}
