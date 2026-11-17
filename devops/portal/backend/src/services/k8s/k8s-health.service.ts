import { K8sClientService } from "./k8s-client.service.js";
import { K8sMapper } from "../../mappers/k8s.mapper.js";
import { ARGO_ROLLOUT_CRD, DEFAULT_WORKLOAD_HEALTH, K8S_CONTENT_TYPES } from "../../constants/k8s.constants.js";
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

    private mapWorkloadToHealth = (workload: any, ns: string, pods: any[]): WorkloadHealthDto | null => {
        const name = workload?.metadata?.name || '';
        const container = workload?.spec?.template?.spec?.containers?.[0];
        if (!name || !container) return null;

        const desired = workload.spec?.replicas ?? 1;
        const ready = workload.status?.readyReplicas ?? 0;
        const available = workload.status?.availableReplicas ?? 0;

        const workloadPods = pods.filter(p => {
            const pName = p.metadata?.name || '';
            const owner = p.metadata?.ownerReferences?.[0]?.name || '';
            return pName.startsWith(`${name}-`) || pName === name || owner.startsWith(`${name}-`);
        });

        let totalRestarts = 0;
        for (const pod of workloadPods) {
            for (const cs of pod.status?.containerStatuses || []) {
                totalRestarts += cs.restartCount || 0;
            }
        }

        const startup = this.mapper.toProbeDefinition(container.startupProbe);
        const liveness = this.mapper.toProbeDefinition(container.livenessProbe);
        const readiness = this.mapper.toProbeDefinition(container.readinessProbe);
        const status = this.mapper.calculateHealthStatus(desired, ready, Boolean(startup || liveness || readiness));

        return {
            name,
            namespace: ns,
            containerName: container.name,
            replicas: { desired, ready, available },
            restartCount: totalRestarts,
            startupProbe: startup,
            livenessProbe: liveness,
            readinessProbe: readiness,
            status
        };
    };

    getWorkloadHealth = async (namespace?: string): Promise<WorkloadHealthDto[]> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const customApi = this.client.customObjectsApi as any;

            const perNsResults = await Promise.all(
                targetNamespaces.map(async (ns): Promise<WorkloadHealthDto[]> => {
                    const nsItems: WorkloadHealthDto[] = [];
                    try {
                        const [deployRes, rolloutsRes, podRes] = await Promise.allSettled([
                            this.client.appsApi.listNamespacedDeployment({ namespace: ns }),
                            customApi.listNamespacedCustomObject({
                                group: ARGO_ROLLOUT_CRD.GROUP,
                                version: ARGO_ROLLOUT_CRD.VERSION,
                                namespace: ns,
                                plural: ARGO_ROLLOUT_CRD.PLURAL
                            }),
                            this.client.coreApi.listNamespacedPod({ namespace: ns })
                        ]);

                        const pods = podRes.status === 'fulfilled' ? (podRes.value.items || []) : [];

                        if (deployRes.status === 'fulfilled') {
                            for (const dep of deployRes.value.items || []) {
                                const dto = this.mapWorkloadToHealth(dep, ns, pods);
                                if (dto) nsItems.push(dto);
                            }
                        }

                        if (rolloutsRes.status === 'fulfilled') {
                            const rolloutsList = rolloutsRes.value?.items || rolloutsRes.value?.body?.items || [];
                            for (const ro of rolloutsList) {
                                const dto = this.mapWorkloadToHealth(ro, ns, pods);
                                if (dto) nsItems.push(dto);
                            }
                        }
                    } catch (nsErr) {
                        console.warn(`[K8sHealthService] Hiba a(z) '${ns}' névtér szondáinak lekérésekor:`, (nsErr as any)?.message || nsErr);
                    }
                    return nsItems;
                })
            );

            const results = perNsResults.flat();

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

    private applyProbeToContainer = (container: any, probeKind: UpdateProbeDto['probeKind'], k8sProbe: any): void => {
        if (probeKind === 'startup') {
            if (k8sProbe) container.startupProbe = k8sProbe;
            else delete container.startupProbe;
        } else if (probeKind === 'liveness') {
            if (k8sProbe) container.livenessProbe = k8sProbe;
            else delete container.livenessProbe;
        } else if (probeKind === 'readiness') {
            if (k8sProbe) container.readinessProbe = k8sProbe;
            else delete container.readinessProbe;
        }
    };

    updateWorkloadProbe = async (dto: UpdateProbeDto): Promise<WorkloadHealthDto> => {
        try {
            const k8sProbe = this.mapper.toK8sProbe(dto.probe);
            let updatedContainerName = dto.containerName || 'app';
            let replicaCounts = { desired: 1, ready: 0, available: 0 };

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

                updatedContainerName = container.name;
                replicaCounts = {
                    desired: dep.spec?.replicas ?? 1,
                    ready: dep.status?.readyReplicas ?? 0,
                    available: dep.status?.availableReplicas ?? 0
                };

                this.applyProbeToContainer(container, dto.probeKind, k8sProbe);

                if (dep.spec?.template?.metadata) {
                    if (!dep.spec.template.metadata.annotations) dep.spec.template.metadata.annotations = {};
                    dep.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();
                }

                await this.client.appsApi.replaceNamespacedDeployment({
                    name: dto.deploymentName,
                    namespace: dto.namespace,
                    body: dep
                });
            } catch {
                const customApi = this.client.customObjectsApi as any;
                const ro = await customApi.getNamespacedCustomObject({
                    group: ARGO_ROLLOUT_CRD.GROUP,
                    version: ARGO_ROLLOUT_CRD.VERSION,
                    namespace: dto.namespace,
                    plural: ARGO_ROLLOUT_CRD.PLURAL,
                    name: dto.deploymentName
                });

                const containers = ro?.spec?.template?.spec?.containers || [];
                const container = containers.find((c: any) => !dto.containerName || c.name === dto.containerName) || containers[0];
                if (!container) {
                    throw new Error(`Nem található konténer a(z) '${dto.deploymentName}' munkaterhelésben.`);
                }

                updatedContainerName = container.name;
                replicaCounts = {
                    desired: ro.spec?.replicas ?? 1,
                    ready: ro.status?.readyReplicas ?? 0,
                    available: ro.status?.availableReplicas ?? 0
                };

                this.applyProbeToContainer(container, dto.probeKind, k8sProbe);

                await customApi.patchNamespacedCustomObject({
                    group: ARGO_ROLLOUT_CRD.GROUP,
                    version: ARGO_ROLLOUT_CRD.VERSION,
                    namespace: dto.namespace,
                    plural: ARGO_ROLLOUT_CRD.PLURAL,
                    name: dto.deploymentName,
                    body: {
                        spec: {
                            template: {
                                metadata: {
                                    annotations: {
                                        'kubectl.kubernetes.io/restartedAt': new Date().toISOString()
                                    }
                                },
                                spec: { containers }
                            }
                        }
                    }
                }, { headers: { "content-type": K8S_CONTENT_TYPES.MERGE_PATCH } });
            }

            const refreshedList = await this.getWorkloadHealth(dto.namespace);
            const found = refreshedList.find(w => w.name === dto.deploymentName);
            if (found) return found;

            return {
                name: dto.deploymentName,
                namespace: dto.namespace,
                containerName: updatedContainerName,
                replicas: replicaCounts,
                restartCount: 0,
                status: 'healthy'
            };
        } catch (error) {
            console.error(`[K8sHealthService] Hiba a szonda frissítésekor (${dto.deploymentName}):`, error);
            throw new Error(`Nem sikerült frissíteni a szondát: ${(error as any)?.message || error}`);
        }
    };

    private resolveProbeTargets = async (
        namespace: string,
        deploymentName: string,
        path: string,
        port: number | string
    ): Promise<string[]> => {
        const requestedPort = typeof port === 'number'
            ? port
            : (Number(port) || (port === 'http' ? 80 : 8080));
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const candidates: string[] = [];
        const baseServiceName = deploymentName.replace(/-(bluegreen|canary)$/, '');

        try {
            const [svcList, podList] = await Promise.all([
                this.client.coreApi.listNamespacedService({ namespace }),
                this.client.coreApi.listNamespacedPod({ namespace })
            ]);

            const matchedSvc = (svcList.items || []).find(s =>
                s.metadata?.name === deploymentName || s.metadata?.name === baseServiceName
            );

            if (matchedSvc?.metadata?.name) {
                const svcPorts = matchedSvc.spec?.ports || [];
                const matchedPort = svcPorts.find(sp =>
                    sp.targetPort === requestedPort ||
                    sp.port === requestedPort ||
                    (typeof port === 'string' && sp.name === port)
                ) || svcPorts[0];

                const resolvedSvcPort = matchedPort?.port ?? requestedPort;
                candidates.push(`http://${matchedSvc.metadata.name}.${namespace}.svc.cluster.local:${resolvedSvcPort}${normalizedPath}`);
            } else {
                candidates.push(`http://${deploymentName}.${namespace}.svc.cluster.local:${requestedPort}${normalizedPath}`);
            }

            const runningPod = (podList.items || []).find(p => {
                const pName = p.metadata?.name || '';
                const pIp = p.status?.podIP;
                return Boolean(pIp) && p.status?.phase === 'Running' && (pName.startsWith(`${deploymentName}-`) || pName === deploymentName);
            });
            if (runningPod?.status?.podIP) {
                candidates.push(`http://${runningPod.status.podIP}:${requestedPort}${normalizedPath}`);
            }
        } catch {
            candidates.push(`http://${deploymentName}.${namespace}.svc.cluster.local:${requestedPort}${normalizedPath}`);
        }

        if (!process.env.KUBERNETES_SERVICE_HOST) {
            candidates.push(
                `http://127.0.0.1:${requestedPort}${normalizedPath}`,
                `http://localhost:${requestedPort}${normalizedPath}`
            );
        }

        return Array.from(new Set(candidates));
    };

    testProbeEndpoint = async (
        namespace: string,
        deploymentName: string,
        path: string = '/actuator/health',
        port: number | string = 8080
    ): Promise<ProbeTestResultDto> => {
        const startTime = Date.now();
        const testedAt = new Date().toISOString();
        const candidates = await this.resolveProbeTargets(namespace, deploymentName, path, port);

        let lastError: any = null;
        let lastStatusCode: number | undefined = undefined;

        for (const targetUrl of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

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
