import { K8sClientService } from "./k8s-client.service.js";
import { K8sMapper } from "../../mappers/k8s.mapper.js";
import { DEFAULT_WORKLOAD_HEALTH } from "../../constants/k8s.constants.js";
import type {
    WorkloadHealthDto,
    UpdateProbeDto,
    ProbeTestResultDto
} from "../../dtos/healthcheck.dto.js";

export class K8sHealthService {
    private client: K8sClientService;
    private mapper: K8sMapper;

    constructor() {
        this.client = K8sClientService.getInstance();
        this.mapper = new K8sMapper();
    }

    getWorkloadHealth = async (namespace?: string): Promise<WorkloadHealthDto[]> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const results: WorkloadHealthDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const [deployList, podList] = await Promise.all([
                        this.client.appsApi.listNamespacedDeployment({ namespace: ns }),
                        this.client.coreApi.listNamespacedPod({ namespace: ns })
                    ]);

                    const pods = podList.items || [];

                    for (const dep of deployList.items || []) {
                        const depName = dep.metadata?.name || '';
                        const container = dep.spec?.template?.spec?.containers?.[0];
                        if (!container) continue;

                        const desired = dep.spec?.replicas ?? 1;
                        const ready = dep.status?.readyReplicas ?? 0;
                        const available = dep.status?.availableReplicas ?? 0;

                        const depPods = pods.filter(p => p.metadata?.name?.startsWith(depName));
                        let totalRestarts = 0;
                        for (const pod of depPods) {
                            for (const cs of pod.status?.containerStatuses || []) {
                                totalRestarts += cs.restartCount || 0;
                            }
                        }

                        const startup = this.mapper.toProbeDefinition(container.startupProbe);
                        const liveness = this.mapper.toProbeDefinition(container.livenessProbe);
                        const readiness = this.mapper.toProbeDefinition(container.readinessProbe);
                        const status = this.mapper.calculateHealthStatus(desired, ready, Boolean(startup || liveness || readiness));

                        results.push({
                            name: depName,
                            namespace: ns,
                            containerName: container.name,
                            replicas: { desired, ready, available },
                            restartCount: totalRestarts,
                            startupProbe: startup,
                            livenessProbe: liveness,
                            readinessProbe: readiness,
                            status
                        });
                    }
                } catch (nsErr) {
                    console.warn(`[K8sHealthService] Hiba a(z) '${ns}' névtér szondáinak lekérésekor:`, (nsErr as any)?.message || nsErr);
                }
            }

            if (results.length === 0) {
                return namespace && namespace !== 'all'
                    ? DEFAULT_WORKLOAD_HEALTH.filter(w => w.namespace === namespace)
                    : DEFAULT_WORKLOAD_HEALTH;
            }

            return results;
        } catch (error) {
            console.error('[K8sHealthService] Hiba a szondák lekérésekor:', error);
            return [];
        }
    };

    updateWorkloadProbe = async (dto: UpdateProbeDto): Promise<WorkloadHealthDto> => {
        try {
            const dep = await this.client.appsApi.readNamespacedDeployment({
                name: dto.deploymentName,
                namespace: dto.namespace
            });

            const container = dep.spec?.template?.spec?.containers?.find(
                c => !dto.containerName || c.name === dto.containerName
            ) || dep.spec?.template?.spec?.containers?.[0];

            if (!container) {
                throw new Error(`Nem található konténer a(z) '${dto.deploymentName}' deploymentben.`);
            }

            const k8sProbe = this.mapper.toK8sProbe(dto.probe);

            if (dto.probeKind === 'startup') {
                if (k8sProbe) {
                    container.startupProbe = k8sProbe;
                } else {
                    delete container.startupProbe;
                }
            } else if (dto.probeKind === 'liveness') {
                if (k8sProbe) {
                    container.livenessProbe = k8sProbe;
                } else {
                    delete container.livenessProbe;
                }
            } else if (dto.probeKind === 'readiness') {
                if (k8sProbe) {
                    container.readinessProbe = k8sProbe;
                } else {
                    delete container.readinessProbe;
                }
            }

            if (dep.spec?.template?.metadata) {
                if (!dep.spec.template.metadata.annotations) {
                    dep.spec.template.metadata.annotations = {};
                }
                dep.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();
            }

            await this.client.appsApi.replaceNamespacedDeployment({
                name: dto.deploymentName,
                namespace: dto.namespace,
                body: dep
            });

            const refreshedList = await this.getWorkloadHealth(dto.namespace);
            const found = refreshedList.find(w => w.name === dto.deploymentName);
            if (found) return found;

            return {
                name: dto.deploymentName,
                namespace: dto.namespace,
                containerName: container.name,
                replicas: {
                    desired: dep.spec?.replicas ?? 1,
                    ready: dep.status?.readyReplicas ?? 0,
                    available: dep.status?.availableReplicas ?? 0
                },
                restartCount: 0,
                status: 'healthy'
            };
        } catch (error) {
            console.error(`[K8sHealthService] Hiba a szonda frissítésekor (${dto.deploymentName}):`, error);
            throw new Error(`Nem sikerült frissíteni a szondát: ${(error as any)?.message || error}`);
        }
    };

    testProbeEndpoint = async (
        namespace: string,
        deploymentName: string,
        path: string = '/actuator/health',
        port: number | string = 8080
    ): Promise<ProbeTestResultDto> => {
        const startTime = Date.now();
        const testedAt = new Date().toISOString();

        const portNumber = typeof port === 'number' ? port : (port === 'http' ? 80 : 8080);
        const candidates = [
            `http://${deploymentName}.${namespace}.svc.cluster.local:${portNumber}${path}`,
            `http://127.0.0.1:${portNumber}${path}`,
            `http://localhost:${portNumber}${path}`
        ];

        let lastError: any = null;
        let lastStatusCode: number | undefined = undefined;

        for (const targetUrl of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const res = await fetch(targetUrl, {
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const responseTimeMs = Date.now() - startTime;
                lastStatusCode = res.status;

                if (res.ok) {
                    return {
                        success: true,
                        statusCode: res.status,
                        responseTimeMs,
                        message: `Sikeres szonda válasz (HTTP ${res.status}): A végpont aktív és kiszolgálja a kéréseket.`,
                        testedAt
                    };
                } else {
                    return {
                        success: false,
                        statusCode: res.status,
                        responseTimeMs,
                        message: `A szonda végpont hibát adott vissza (HTTP ${res.status}).`,
                        testedAt
                    };
                }
            } catch (err: any) {
                lastError = err;
            }
        }

        const responseTimeMs = Date.now() - startTime;
        return {
            success: false,
            statusCode: lastStatusCode,
            responseTimeMs,
            message: lastError ? `Nem sikerült elérni a végpontot: ${lastError.message || lastError}` : 'A végpont nem válaszol.',
            testedAt
        };
    };
}
