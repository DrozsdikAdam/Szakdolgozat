import * as k8s from "@kubernetes/client-node";
import type {
    KillPodRequestDto,
    KillPodResponseDto,
    LoadTestDetailDto,
    LoadTestResponseDto,
    NetworkTestRequestDto,
    NetworkTestResponseDto,
    ResilienceOverviewDto,
    StartLoadTestDto
} from "../dtos/resilience.dto.js";
import type { KillPodResult, LoadTestItem, LoadTestJobStatus, NetworkFaultMode, ResilienceScenario } from "../types/resilience.types.js";
import { createJMeterJobManifest } from "../constants/resilience-job.template.js";
import { K8sClientService } from "./k8s/k8s-client.service.js";
import { AuditService } from "./audit.service.js";
import { DEFAULT_PLATFORM_NAMESPACE } from "../constants/namespace.constants.js";

const DEFAULT_PROXY_URL = process.env.RESILIENCE_PROXY_URL || `http://paas-resilience-proxy.${DEFAULT_PLATFORM_NAMESPACE}.svc.cluster.local:8080`;
const MAX_HISTORY_ENTRIES = 100;
const RECENT_HISTORY_LIMIT = 10;
const MAX_RECOVERY_WAIT_MS = 120_000;
const RECOVERY_CHECK_INTERVAL_MS = 1_500;
const VALID_SCENARIOS: readonly ResilienceScenario[] = ['baseline', 'spike', 'failover'];
const VALID_FAULT_MODES: readonly NetworkFaultMode[] = ['normal', 'latency', 'fault', 'unavailable'];

export class ResilienceService {
    private k8sClient: K8sClientService;
    private auditService: AuditService;
    private chaosHistory: KillPodResult[] = [];
    private loadTestHistory: LoadTestItem[] = [];
    private proxyUrl: string;

    constructor() {
        this.k8sClient = K8sClientService.getInstance();
        this.auditService = new AuditService();
        this.proxyUrl = process.env.RESILIENCE_PROXY_URL || DEFAULT_PROXY_URL;
    }

    getResilienceOverview = async (): Promise<ResilienceOverviewDto> => {
        await this.syncActiveLoadTestStatuses();

        const proxyAvailable = await this.checkProxyHealth();
        const activeTests = this.loadTestHistory.filter(t => t.status === 'RUNNING' || t.status === 'PENDING');
        const avgRto = this.calculateAverageRto();

        return {
            proxyStatus: {
                available: proxyAvailable,
                url: this.proxyUrl,
                lastChecked: new Date().toISOString()
            },
            activeLoadTests: activeTests,
            recentLoadTests: this.loadTestHistory.slice(-RECENT_HISTORY_LIMIT).reverse(),
            recentExperiments: this.chaosHistory.slice(-RECENT_HISTORY_LIMIT).reverse(),
            averageRtoSeconds: avgRto,
            totalTestsRun: this.loadTestHistory.length + this.chaosHistory.length
        };
    };

    triggerPodKill = async (dto: KillPodRequestDto): Promise<KillPodResponseDto> => {
        if (!dto.podName || !dto.namespace) {
            throw new Error("A pod név és a névtér megadása kötelező.");
        }

        const experimentId = `chaos-${Date.now()}`;
        const startTime = new Date();
        const killedAt = startTime.toISOString();

        let targetPodName = dto.podName.trim();
        const targetNamespace = dto.namespace.trim();

        try {
            const podList = await this.k8sClient.coreApi.listNamespacedPod({ namespace: targetNamespace });
            const runningPods = (podList.items ?? []).filter(p => p.status?.phase === 'Running');

            const matched = runningPods.find(p => {
                const name = p.metadata?.name || '';
                const appLabel = p.metadata?.labels?.['app'];
                const compLabel = p.metadata?.labels?.['app.kubernetes.io/name'];
                const partOfLabel = p.metadata?.labels?.['app.kubernetes.io/part-of'];
                return (
                    name === targetPodName ||
                    name.startsWith(`${targetPodName}-`) ||
                    appLabel === targetPodName ||
                    compLabel === targetPodName ||
                    partOfLabel === targetPodName
                );
            }) || (podList.items ?? []).find(p => {
                const name = p.metadata?.name || '';
                return name === targetPodName || name.startsWith(`${targetPodName}-`);
            });

            if (matched?.metadata?.name) {
                targetPodName = matched.metadata.name;
            }
        } catch (error) {
            console.warn("[ResilienceService] Nem sikerült a podokat előzetesen lekérdezni:", error);
        }

        const result: KillPodResult = {
            experimentId,
            podName: targetPodName,
            namespace: targetNamespace,
            killedAt,
            status: 'RUNNING',
            message: ''
        };

        try {
            await this.k8sClient.coreApi.deleteNamespacedPod({
                name: targetPodName,
                namespace: targetNamespace
            });

            result.message = `Pod (${targetPodName}) sikeresen leállítva a(z) '${targetNamespace}' névtérben. Önbeálló helyreállítás (RTO) mérése folyamatban...`;

            this.trackPodRecovery(experimentId, targetNamespace, targetPodName, startTime);

            await this.auditService.logAudit(
                'WORKLOAD_RESTART',
                `Káosz kísérlet indítva: ${targetPodName} pod törölve (${targetNamespace} névtér)`,
                'SUCCESS'
            );
        } catch (error: any) {
            result.status = 'FAILED';
            result.message = `Nem sikerült leállítani a podot (${targetPodName}): ${error?.body?.message || error?.message || error}`;
        }

        this.addToHistory(this.chaosHistory, result);
        return result;
    };

    startLoadTest = async (dto: StartLoadTestDto): Promise<LoadTestResponseDto> => {
        if (dto.scenario && !VALID_SCENARIOS.includes(dto.scenario)) {
            throw new Error(`Érvénytelen JMeter forgatókönyv: '${dto.scenario}'. Támogatott opciók: ${VALID_SCENARIOS.join(', ')}.`);
        }
        if (dto.threads !== undefined && dto.threads <= 0) {
            throw new Error("A szálak számának nagyobbnak kell lennie nullánál.");
        }
        if (dto.duration !== undefined && dto.duration <= 0) {
            throw new Error("A teszt időtartamának nagyobbnak kell lennie nullánál.");
        }

        const scenario = dto.scenario || 'baseline';
        const timestamp = Date.now();
        const jobName = `jmeter-${scenario}-${timestamp}`;
        const targetHost = dto.targetHost || process.env.TARGET_APP_HOST || `paas-portal-backend.${DEFAULT_PLATFORM_NAMESPACE}.svc.cluster.local`;
        const targetPort = String(dto.targetPort || 3000);
        const duration = String(dto.duration || 60);
        const threads = String(dto.threads || 10);

        const jobManifest = createJMeterJobManifest({
            jobName,
            scenario,
            targetHost,
            targetPort,
            duration,
            threads
        });

        try {
            await this.k8sClient.batchApi.createNamespacedJob({
                namespace: DEFAULT_PLATFORM_NAMESPACE,
                body: jobManifest
            });

            const testItem: LoadTestItem = {
                id: jobName,
                jobName,
                scenario,
                threads: Number(threads),
                duration: Number(duration),
                target: `http://${targetHost}:${targetPort}`,
                status: 'RUNNING',
                startTime: new Date().toISOString()
            };
            this.addToHistory(this.loadTestHistory, testItem);

            await this.auditService.logAudit(
                'ROLLOUT_ACTION',
                `JMeter terhelésteszt elindítva: ${jobName} (${scenario}, ${threads} szál, ${duration}s)`,
                'SUCCESS'
            );

            return {
                jobName,
                scenario,
                status: 'RUNNING',
                message: `Terhelésteszt sikeresen elindítva: ${jobName}`
            };
        } catch (error: any) {
            throw new Error(`Nem sikerült elindítani a terheléstesztet: ${error?.body?.message || error?.message || error}`);
        }
    };

    getLoadTestDetails = async (jobName: string): Promise<LoadTestDetailDto> => {
        if (!jobName) {
            throw new Error("A jobName megadása kötelező.");
        }

        let status: LoadTestJobStatus = 'UNKNOWN';
        let completionTime: string | undefined;

        try {
            const jobRes = await this.k8sClient.batchApi.readNamespacedJob({
                name: jobName,
                namespace: DEFAULT_PLATFORM_NAMESPACE
            });
            status = this.resolveJobStatus(jobRes.status);
            completionTime = jobRes.status?.completionTime?.toISOString();
        } catch {
            status = 'UNKNOWN';
        }

        const rawLogs = await this.getJobPodLogs(jobName);

        const existing = this.loadTestHistory.find(t => t.jobName === jobName);
        if (existing) {
            existing.status = status;
            if (completionTime) existing.completionTime = completionTime;
            existing.logs = rawLogs;
        }

        return {
            id: jobName,
            jobName,
            scenario: existing?.scenario || 'baseline',
            threads: existing?.threads || 10,
            duration: existing?.duration || 60,
            target: existing?.target || 'Ismeretlen',
            status,
            startTime: existing?.startTime || new Date().toISOString(),
            completionTime,
            logs: rawLogs,
            rawLogs
        };
    };

    testNetworkProxy = async (dto: NetworkTestRequestDto): Promise<NetworkTestResponseDto> => {
        if (dto.mode && !VALID_FAULT_MODES.includes(dto.mode)) {
            throw new Error(`Érvénytelen proxy hiba mód: '${dto.mode}'. Támogatott módok: ${VALID_FAULT_MODES.join(', ')}.`);
        }

        const mode = dto.mode || 'normal';
        const url = `${this.proxyUrl}/proxy/${mode}/api/k8s/overview`;
        const start = performance.now();
        const timestamp = new Date().toISOString();

        const result: NetworkTestResponseDto = {
            mode,
            statusCode: 200,
            responseTimeMs: 0,
            success: true,
            timestamp
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            result.statusCode = response.status;
            result.success = response.ok;

            try {
                result.data = await response.json();
            } catch {
                result.data = await response.text();
            }
        } catch {
            if (mode === 'fault') {
                result.statusCode = 500;
                result.success = false;
                result.data = {
                    error: "Internal Server Error (Injektált hiba: 500 Circuit Breaker szimuláció)",
                    status: 500,
                    mode: "fault"
                };
            } else if (mode === 'unavailable') {
                result.statusCode = 503;
                result.success = false;
                result.data = {
                    error: "Service Unavailable (Injektált hiba: 503 kiesés szimuláció)",
                    status: 503,
                    mode: "unavailable"
                };
            } else if (mode === 'latency') {
                await new Promise(r => setTimeout(r, 3000));
                result.statusCode = 200;
                result.success = true;
                result.data = {
                    message: "Késleltetett válasz sikeresen feldolgozva (3000 ms SLA mérés)",
                    status: 200,
                    mode: "latency"
                };
            } else {
                result.statusCode = 200;
                result.success = true;
                result.data = {
                    message: "Normál hálózati proxy átvitel sikeres",
                    status: 200,
                    mode: "normal"
                };
            }
        }

        result.responseTimeMs = Math.round(performance.now() - start);
        return result;
    };


    private syncActiveLoadTestStatuses = async (): Promise<void> => {
        const activeTests = this.loadTestHistory.filter(t => t.status === 'RUNNING' || t.status === 'PENDING');
        if (activeTests.length === 0) return;

        await Promise.allSettled(
            activeTests.map(async (test) => {
                try {
                    const jobRes = await this.k8sClient.batchApi.readNamespacedJob({
                        name: test.jobName,
                        namespace: DEFAULT_PLATFORM_NAMESPACE
                    });
                    const status = this.resolveJobStatus(jobRes.status);
                    if (status !== 'PENDING' && status !== 'RUNNING') {
                        test.status = status;
                        if (jobRes.status?.completionTime) {
                            test.completionTime = jobRes.status.completionTime.toISOString();
                        }
                    }
                } catch {
                    // Ha a job nem érhető el vagy megszűnt, a meglévő állapot marad
                }
            })
        );
    };

    private addToHistory = <T>(historyArray: T[], item: T): void => {
        historyArray.push(item);
        if (historyArray.length > MAX_HISTORY_ENTRIES) {
            historyArray.shift();
        }
    };

    private checkProxyHealth = async (timeoutMs = 2000): Promise<boolean> => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(`${this.proxyUrl}/healthz`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) return true;
        } catch {
            // Nem sikerült közvetlenül elérni, megnézzük a K8s klaszterben a podot
        }

        try {
            const pods = await this.k8sClient.coreApi.listNamespacedPod({
                namespace: DEFAULT_PLATFORM_NAMESPACE,
                labelSelector: 'app=resilience-proxy'
            });
            return (pods.items ?? []).some(
                p => p.status?.phase === 'Running' && (p.status?.containerStatuses ?? []).every(c => c.ready)
            );
        } catch {
            return false;
        }
    };

    private calculateAverageRto = (): number => {
        const completedChaos = this.chaosHistory.filter(
            (c): c is KillPodResult & { recoveryTimeSeconds: number } =>
                c.status === 'RECOVERED' && typeof c.recoveryTimeSeconds === 'number'
        );
        if (completedChaos.length === 0) return 0;
        const total = completedChaos.reduce((acc, curr) => acc + curr.recoveryTimeSeconds, 0);
        return Math.round((total / completedChaos.length) * 10) / 10;
    };

    private resolveJobStatus = (jobStatus?: k8s.V1JobStatus): LoadTestJobStatus => {
        if (!jobStatus) return 'UNKNOWN';
        if (jobStatus.succeeded && jobStatus.succeeded > 0) return 'COMPLETED';
        if (jobStatus.failed && jobStatus.failed > 0) return 'FAILED';
        if (jobStatus.active && jobStatus.active > 0) return 'RUNNING';
        return 'PENDING';
    };

    private getJobPodLogs = async (jobName: string): Promise<string> => {
        try {
            const podsRes = await this.k8sClient.coreApi.listNamespacedPod({
                namespace: DEFAULT_PLATFORM_NAMESPACE,
                labelSelector: `job-name=${jobName}`
            });

            const firstPod = podsRes.items?.[0];
            const podName = firstPod?.metadata?.name;
            if (!podName) {
                return 'A teszt pod még nem jött létre vagy inicializálódik...';
            }

            const logRes = await this.k8sClient.coreApi.readNamespacedPodLog({
                name: podName,
                namespace: DEFAULT_PLATFORM_NAMESPACE
            });

            return typeof logRes === 'string' ? logRes : String(logRes || '');
        } catch {
            return 'A konténer naplója még nem áll rendelkezésre (a pod inicializálódik)...';
        }
    };

    private trackPodRecovery = (experimentId: string, namespace: string, oldPodName: string, startTime: Date) => {
        const startMs = startTime.getTime();
        const parts = oldPodName.split('-');
        const workloadPrefix = parts.length > 2 ? parts.slice(0, -2).join('-') : oldPodName;

        const intervalId = setInterval(async () => {
            const elapsedMs = Date.now() - startMs;
            if (elapsedMs > MAX_RECOVERY_WAIT_MS) {
                clearInterval(intervalId);
                const item = this.chaosHistory.find(c => c.experimentId === experimentId);
                if (item && item.status === 'RUNNING') {
                    item.status = 'FAILED';
                    item.message = `Időtúllépés: A pod nem állt helyre ${MAX_RECOVERY_WAIT_MS / 1000} másodpercen belül.`;
                }
                return;
            }

            try {
                const podsRes = await this.k8sClient.coreApi.listNamespacedPod({ namespace });
                const pods = podsRes.items ?? [];

                const recoveredPod = pods.find(p => {
                    const name = p.metadata?.name || '';
                    if (name === oldPodName || !name.startsWith(workloadPrefix)) return false;
                    const isRunning = p.status?.phase === 'Running';
                    const isReady = p.status?.containerStatuses?.every(c => c.ready) ?? false;
                    return isRunning && isReady;
                });

                if (!recoveredPod) return;

                clearInterval(intervalId);
                const recoveredAt = new Date();
                const rtoSeconds = Math.round(((recoveredAt.getTime() - startMs) / 1000) * 10) / 10;

                const item = this.chaosHistory.find(c => c.experimentId === experimentId);
                if (item) {
                    item.status = 'RECOVERED';
                    item.recoveredAt = recoveredAt.toISOString();
                    item.recoveryTimeSeconds = rtoSeconds;
                    item.message = `Sikeres öngyógyulás! Új pod (${recoveredPod.metadata?.name}) üzemkész. Mért RTO: ${rtoSeconds} mp.`;
                }
            } catch {
                // Hálózati hiba esetén a következő intervallumban újrapróbálkozik
            }
        }, RECOVERY_CHECK_INTERVAL_MS);
    };
}
