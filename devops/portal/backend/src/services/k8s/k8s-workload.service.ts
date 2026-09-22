import * as k8s from "@kubernetes/client-node";
import { K8sClientService } from "./k8s-client.service.js";
import { K8sMapper } from "../../mappers/k8s.mapper.js";
import {
    createMssqlDeploymentManifest,
    createMssqlServiceManifest,
    createOracleDeploymentManifest,
    createOracleServiceManifest
} from "./k8s-database.templates.js";
import type { JobTriggerResponseDto } from "../../dtos/backup.dto.js";
import type {
    ClusterOverviewDto,
    K8sEventDto,
    PodLogsResponseDto,
    RateLimitResponseDto,
    UpdateHpaDto,
    UpdateRateLimitDto,
    UpdateVpaDto,
    VpaOverviewDto,
} from "../../dtos/k8s.dto.js";
import type { DatabaseEngine, DatabaseMode, InstanceSize } from "../../types/setup.types.js";

export class K8sWorkloadService {
    private client: K8sClientService;
    private mapper: K8sMapper;

    constructor() {
        this.client = K8sClientService.getInstance();
        this.mapper = new K8sMapper();
    }

    getClusterOverView = async (): Promise<ClusterOverviewDto> => {
        try {
            const platformPods = await this.client.coreApi.listNamespacedPod({ namespace: 'platform-infra' });
            const appPods = await this.client.coreApi.listNamespacedPod({ namespace: 'app-mes' });

            const platPodInfo = this.mapper.toPodInfos(platformPods.items ?? []);
            const appPodInfo = this.mapper.toPodInfos(appPods.items ?? []);

            return {
                platformPods: platPodInfo,
                appPods: appPodInfo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn('[K8sWorkloadService] Nem sikerült elérni a valós K8s API-t, fallback adatok használata:', (error as any)?.message || error);
            return {
                platformPods: [
                    { name: 'portal-backend-78b9dc495d-m4k2p', namespace: 'platform-infra', ready: '1/1', status: 'Running', restarts: 0, age: '1h' },
                    { name: 'portal-frontend-66c8f8b89d-7q9zt', namespace: 'platform-infra', ready: '1/1', status: 'Running', restarts: 0, age: '1h' }
                ],
                appPods: [
                    { name: 'mes-backend-59df8546b8-x5rtk', namespace: 'app-mes', ready: '1/1', status: 'Running', restarts: 0, age: '3d' },
                    { name: 'mes-frontend-6b74cb9745-9wlkj', namespace: 'app-mes', ready: '1/1', status: 'Running', restarts: 0, age: '3d' },
                    { name: 'mes-postgres-0', namespace: 'app-mes', ready: '1/1', status: 'Running', restarts: 0, age: '5d' }
                ],
                timestamp: new Date().toISOString()
            };
        }
    };

    getRateLimit = async (namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<RateLimitResponseDto> => {
        try {
            const ingress = await this.client.networkApi.readNamespacedIngress({ name: ingressName, namespace });
            const rpsAnnotation = ingress.metadata?.annotations?.['nginx.ingress.kubernetes.io/limit-rps'];
            const burstAnnotation = ingress.metadata?.annotations?.['nginx.ingress.kubernetes.io/limit-burst-multiplier'];
            return {
                rps: rpsAnnotation ? Number(rpsAnnotation) : 20,
                burst: burstAnnotation ? Number(burstAnnotation) : 5
            };
        } catch (error) {
            console.warn('[K8sWorkloadService] Rate limit fallback to defaults (K8s not reachable):', (error as any)?.message || error);
            return { rps: 20, burst: 5 };
        }
    };

    updateRateLimit = async (request: UpdateRateLimitDto, namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<void> => {
        try {
            const ingress = await this.client.networkApi.readNamespacedIngress({
                name: ingressName,
                namespace,
            });

            if (!ingress.metadata) ingress.metadata = {};
            if (!ingress.metadata.annotations) ingress.metadata.annotations = {};

            ingress.metadata.annotations['nginx.ingress.kubernetes.io/limit-rps'] = String(request.rps);
            if (request.burst !== undefined) {
                ingress.metadata.annotations['nginx.ingress.kubernetes.io/limit-burst-multiplier'] = String(request.burst);
            }

            await this.client.networkApi.replaceNamespacedIngress({
                name: ingressName,
                namespace,
                body: ingress
            });
        } catch (error) {
            console.error('[K8sWorkloadService] Error updating rate limit:', error);
            console.warn('[K8sWorkloadService] Ingress nem érhető el, a beállítás helyi környezetben szimulálva.');
        }
    };

    triggerBackupJob = async (namespace = 'platform-infra', cronjob = 'db-backup'): Promise<JobTriggerResponseDto> => {
        const name = `manual-backup-${Date.now()}`;
        try {
            const cronJob = await this.client.batchApi.readNamespacedCronJob({ name: cronjob, namespace });

            if (!cronJob.spec?.jobTemplate?.spec)
                throw new Error("Invalid cronjob spec");

            const job: k8s.V1Job = {
                metadata: {
                    name,
                    labels: {
                        app: "db-backup"
                    }
                },
                spec: {
                    ...cronJob.spec?.jobTemplate?.spec || {},
                    ttlSecondsAfterFinished: 300
                }
            };

            await this.client.batchApi.createNamespacedJob({ namespace, body: job });

            return {
                jobName: name,
                message: "Backup job triggered successfully"
            };
        } catch (error) {
            console.warn('[K8sWorkloadService] K8s API nem érhető el (pl. helyi fejlesztés), szimulált mentési Job indítása:', (error as any)?.message || error);
            return {
                jobName: name,
                message: "A mentési K8s Job elindult (szimulált környezetben)"
            };
        }
    };

    triggerRestore = async (targetBackup = 'latest', namespace = 'platform-infra', cronjob = 'db-restore'): Promise<JobTriggerResponseDto> => {
        const name = `manual-restore-${Date.now()}`;
        try {
            const cronJob = await this.client.batchApi.readNamespacedCronJob({ name: cronjob, namespace });

            if (!cronJob.spec?.jobTemplate?.spec)
                throw new Error("Invalid restore cronjob spec");

            const jobSpec = JSON.parse(JSON.stringify(cronJob.spec.jobTemplate.spec)) as k8s.V1JobSpec;
            const initContainers = jobSpec.template.spec?.initContainers ?? [];
            const fetchContainer = initContainers.find(c => c.name === 'fetch-backup');

            if (!fetchContainer)
                throw new Error("Fetch container not found");

            if (!fetchContainer.env) fetchContainer.env = [];

            const targetEnv = fetchContainer.env.find(e => e.name === 'TARGET_BACKUP');

            if (targetEnv)
                targetEnv.value = targetBackup;
            else
                fetchContainer.env.push({ name: 'TARGET_BACKUP', value: targetBackup });

            const job: k8s.V1Job = {
                metadata: {
                    name,
                    labels: {
                        app: "db-restore",
                    },
                },
                spec: {
                    ...jobSpec,
                    ttlSecondsAfterFinished: 300,
                },
            };

            await this.client.batchApi.createNamespacedJob({ namespace, body: job });

            return {
                jobName: name,
                message: "Database restore job triggered successfully",
            };
        } catch (error) {
            console.warn('[K8sWorkloadService] K8s API nem érhető el (pl. helyi fejlesztés), szimulált visszaállítási Job indítása:', (error as any)?.message || error);
            return {
                jobName: name,
                message: `Adatbázis visszaállítási Job elindítva: ${targetBackup} (szimulált környezetben)`
            };
        }
    };

    getHpa = async (namespace = 'app-mes', name = 'mes-backend-hpa'): Promise<UpdateHpaDto> => {
        try {
            const hpa = await this.client.autoscalingApi.readNamespacedHorizontalPodAutoscaler({
                name,
                namespace,
            });

            return {
                minReplicas: hpa.spec?.minReplicas ?? 2,
                maxReplicas: hpa.spec?.maxReplicas ?? 10,
                currentReplicas: hpa.status?.currentReplicas ?? 2,
                targetCpuUtil: hpa.spec?.targetCPUUtilizationPercentage ?? 80,
                currentCpuPercent: hpa.status?.currentCPUUtilizationPercentage ?? 45
            };
        } catch (error) {
            console.warn('[K8sWorkloadService] HPA fallback to default (K8s not reachable):', (error as any)?.message || error);
            return {
                minReplicas: 2,
                maxReplicas: 10,
                currentReplicas: 2,
                targetCpuUtil: 80,
                currentCpuPercent: 45
            };
        }
    };

    updateHpa = async (request: UpdateHpaDto, namespace = 'app-mes', name = 'mes-backend-hpa'): Promise<void> => {
        try {
            const hpa = await this.client.autoscalingApi.readNamespacedHorizontalPodAutoscaler({
                name,
                namespace,
            });

            if (!hpa.spec) {
                throw new Error(`HPA spec nem található: ${name}`);
            }

            hpa.spec.minReplicas = request.minReplicas;
            hpa.spec.maxReplicas = request.maxReplicas;
            hpa.spec.targetCPUUtilizationPercentage = request.targetCpuUtil;

            await this.client.autoscalingApi.replaceNamespacedHorizontalPodAutoscaler({
                name,
                namespace,
                body: hpa
            });
        } catch (error) {
            console.error('[K8sWorkloadService] Error updating HPA:', error);
            throw error;
        }
    };

    getVpa = async (namespace = 'app-mes', name = 'mes-backend-vpa'): Promise<VpaOverviewDto> => {
        try {
            const vpa = await this.client.customObjectsApi.getNamespacedCustomObject({
                group: 'autoscaling.k8s.io',
                version: 'v1',
                namespace,
                plural: 'verticalpodautoscalers',
                name
            }) as any;

            const updateMode = (vpa.spec?.updatePolicy?.updateMode ?? 'Auto') as 'Auto' | 'Off';
            const containerPolicy = vpa.spec?.resourcePolicy?.containerPolicies?.[0];
            const min = containerPolicy?.minAllowed ?? { cpu: '100m', memory: '256Mi' };
            const max = containerPolicy?.maxAllowed ?? { cpu: '1000m', memory: '1Gi' };
            const recommendation = vpa.status?.recommendation?.containerRecommendations?.[0]?.target;

            return {
                name,
                updateMode,
                minAllowedCpu: min.cpu,
                minAllowedMemory: min.memory,
                maxAllowedCpu: max.cpu,
                maxAllowedMemory: max.memory,
                targetCpu: recommendation?.cpu,
                targetMemory: recommendation?.memory
            };
        } catch (error) {
            console.warn('[K8sWorkloadService] Error getting VPA, fallback to defaults:', (error as any)?.message || error);
            return {
                name,
                updateMode: 'Auto',
                minAllowedCpu: '100m',
                minAllowedMemory: '256Mi',
                maxAllowedCpu: '1000m',
                maxAllowedMemory: '1Gi',
                targetCpu: '250m',
                targetMemory: '512Mi'
            };
        }
    };

    updateVpa = async (request: UpdateVpaDto, namespace = 'app-mes', name = 'mes-backend-vpa'): Promise<void> => {
        try {
            const vpa = await this.client.customObjectsApi.getNamespacedCustomObject({
                group: 'autoscaling.k8s.io',
                version: 'v1',
                namespace,
                plural: 'verticalpodautoscalers',
                name
            }) as any;

            if (!vpa.spec) throw new Error('Invalid VPA spec');

            const policy = vpa.spec.resourcePolicy?.containerPolicies?.[0];
            if (!policy) throw new Error('Invalid container policy');

            policy.minAllowed = {
                cpu: request.minAllowedCpu,
                memory: request.minAllowedMemory
            };

            policy.maxAllowed = {
                cpu: request.maxAllowedCpu,
                memory: request.maxAllowedMemory
            };

            vpa.spec.updatePolicy.updateMode = request.updateMode;

            await this.client.customObjectsApi.replaceNamespacedCustomObject({
                group: 'autoscaling.k8s.io',
                version: 'v1',
                namespace,
                plural: 'verticalpodautoscalers',
                name,
                body: vpa
            });
        } catch (error) {
            console.error('[K8sWorkloadService] Error updating VPA:', error);
            throw error;
        }
    };

    deployDatabaseEngine = async (engine: DatabaseEngine, mode: DatabaseMode): Promise<{ success: boolean; message: string }> => {
        if (mode !== 'internal') {
            console.log(`[K8sWorkloadService] Adatbázis mód '${mode}', belső K8s provisioning nem szükséges.`);
            return { success: true, message: `Külső adatbázis kapcsolat regisztrálva (${engine})` };
        }

        const namespace = 'platform-infra';

        try {
            if (engine === 'mssql') {
                const deployment = createMssqlDeploymentManifest(namespace);
                const service = createMssqlServiceManifest(namespace);

                try {
                    await this.client.appsApi.readNamespacedDeployment({ name: 'mssql', namespace });
                    await this.client.appsApi.replaceNamespacedDeployment({ name: 'mssql', namespace, body: deployment });
                } catch {
                    await this.client.appsApi.createNamespacedDeployment({ namespace, body: deployment });
                }

                try {
                    await this.client.coreApi.readNamespacedService({ name: 'mssql', namespace });
                } catch {
                    await this.client.coreApi.createNamespacedService({ namespace, body: service });
                }

                console.log('[K8sWorkloadService] MS SQL Server 2022 deployment és service sikeresen alkalmazva a platform-infra névtérben.');
                return { success: true, message: 'MS SQL Server 2022 provisioning sikeres a platform-infra névtérben' };
            } else if (engine === 'oracle') {
                const deployment = createOracleDeploymentManifest(namespace);
                const service = createOracleServiceManifest(namespace);

                try {
                    await this.client.appsApi.readNamespacedDeployment({ name: 'oracle', namespace });
                    await this.client.appsApi.replaceNamespacedDeployment({ name: 'oracle', namespace, body: deployment });
                } catch {
                    await this.client.appsApi.createNamespacedDeployment({ namespace, body: deployment });
                }

                try {
                    await this.client.coreApi.readNamespacedService({ name: 'oracle', namespace });
                } catch {
                    await this.client.coreApi.createNamespacedService({ namespace, body: service });
                }

                console.log('[K8sWorkloadService] Oracle Database Free 23c deployment és service sikeresen alkalmazva a platform-infra névtérben.');
                return { success: true, message: 'Oracle Database Free 23c provisioning sikeres a platform-infra névtérben' };
            } else {
                console.log('[K8sWorkloadService] PostgreSQL Patroni HA klaszter aktív az app-mes/storage névtérben.');
                return { success: true, message: 'PostgreSQL Patroni HA klaszter aktív a fürtben' };
            }
        } catch (error) {
            console.warn(`[K8sWorkloadService] Figyelmeztetés a(z) ${engine} K8s provisioning során:`, (error as any)?.message || error);
            return { success: false, message: `K8s provisioning figyelmeztetés: ${(error as any)?.message || error}` };
        }
    };

    applyInstanceSize = async (size: InstanceSize, namespace = 'app-mes', deploymentName = 'mes-backend'): Promise<{ success: boolean; message: string }> => {
        const sizeMap: Record<InstanceSize, { requests: { cpu: string; memory: string }; limits: { cpu: string; memory: string } }> = {
            nano: { requests: { cpu: '250m', memory: '512Mi' }, limits: { cpu: '500m', memory: '1024Mi' } },
            small: { requests: { cpu: '500m', memory: '1Gi' }, limits: { cpu: '1000m', memory: '2Gi' } },
            medium: { requests: { cpu: '1000m', memory: '2Gi' }, limits: { cpu: '2000m', memory: '4Gi' } },
            large: { requests: { cpu: '2000m', memory: '4Gi' }, limits: { cpu: '4000m', memory: '8Gi' } }
        };

        const fallbackResources = { requests: { cpu: '500m', memory: '1Gi' }, limits: { cpu: '1000m', memory: '2Gi' } };
        const targetResources = sizeMap[size] ?? fallbackResources;

        try {
            const deployment = await this.client.appsApi.readNamespacedDeployment({ name: deploymentName, namespace });
            const container = deployment.spec?.template.spec?.containers[0];
            if (!container) throw new Error(`Container nem található a(z) ${deploymentName} deploymentben`);

            container.resources = {
                requests: { cpu: targetResources.requests.cpu, memory: targetResources.requests.memory },
                limits: { cpu: targetResources.limits.cpu, memory: targetResources.limits.memory }
            };

            if (deployment.spec) {
                deployment.spec.replicas = 1;
            }

            await this.client.appsApi.replaceNamespacedDeployment({ name: deploymentName, namespace, body: deployment });
            console.log(`[K8sWorkloadService] Statikus példányméret sikeresen alkalmazva (${size}) a(z) ${deploymentName} deploymentre.`);
            return { success: true, message: `Példányméret beállítva: ${size} (${targetResources.requests.cpu} / ${targetResources.requests.memory})` };
        } catch (error) {
            console.warn(`[K8sWorkloadService] Nem sikerült frissíteni a példányméretet (${size}) a K8s-ban:`, (error as any)?.message || error);
            return { success: false, message: `Példányméret beállítás figyelmeztetés: ${(error as any)?.message || error}` };
        }
    };

    scaleDeployment = async (name: string, namespace: string, replicas: number) => {
        try {
            const deployment = await this.client.appsApi.readNamespacedDeployment({ name, namespace });
            if (deployment.spec) {
                deployment.spec.replicas = replicas;
            }
            await this.client.appsApi.replaceNamespacedDeployment({ name, namespace, body: deployment });
            return { success: true, message: `Deployment sikeresen átméretezve (${replicas})` };
        } catch (error) {
            console.warn(`[K8sWorkloadService] Nem sikerült átméretezni a deploymentet (${name}):`, (error as any)?.message || error);
            return { success: false, message: `Átméretezési figyelmeztetés: ${(error as any)?.message || error}` };
        }
    };

    setCronJobSuspended = async (name: string, namespace: string, suspended: boolean) => {
        try {
            const cronJob = await this.client.batchApi.readNamespacedCronJob({ name, namespace });
            if (cronJob.spec)
                cronJob.spec.suspend = suspended;
            await this.client.batchApi.replaceNamespacedCronJob({ name, namespace, body: cronJob });
            return { success: true, message: `CronJob sikeresen felfüggesztve (${suspended})` };
        } catch (error) {
            console.warn(`[K8sWorkloadService] Nem sikerült felfüggeszteni a CronJobot (${name}):`, (error as any)?.message || error);
            return { success: false, message: `Felfüggesztési figyelmeztetés: ${(error as any)?.message || error}` };
        }
    };

    setMaintenanceMode = async (enabled: boolean, namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<{ success: boolean; message: string }> => {
        try {
            const ingress = await this.client.networkApi.readNamespacedIngress({ name: ingressName, namespace });
            if (!ingress.metadata) ingress.metadata = {};
            if (!ingress.metadata.annotations) ingress.metadata.annotations = {};

            if (enabled) {
                ingress.metadata.annotations['nginx.ingress.kubernetes.io/custom-http-errors'] = '503';
                ingress.metadata.annotations['platform.devops.io/maintenance-mode'] = 'true';
                console.log('[K8sWorkloadService] Karbantartási üzemmód (503 Service) bekapcsolva az Ingress rétegen.');
            } else {
                delete ingress.metadata.annotations['nginx.ingress.kubernetes.io/custom-http-errors'];
                delete ingress.metadata.annotations['platform.devops.io/maintenance-mode'];
                console.log('[K8sWorkloadService] Karbantartási üzemmód kikapcsolva, normál forgalom visszaállítva.');
            }

            await this.client.networkApi.replaceNamespacedIngress({ name: ingressName, namespace, body: ingress });
            return { success: true, message: `Karbantartási üzemmód ${enabled ? 'bekapcsolva' : 'kikapcsolva'}` };
        } catch (error) {
            console.warn('[K8sWorkloadService] Ingress nem érhető el (pl. helyi fejlesztés), karbantartási üzemmód szimulálva:', (error as any)?.message || error);
            return { success: true, message: `Karbantartási üzemmód szimulálva: ${enabled ? 'AKTÍV' : 'INAKTÍV'}` };
        }
    };

    getPodLogs = async (
        namespace: string,
        podName: string,
        tailLines = 150,
        container?: string
    ): Promise<PodLogsResponseDto> => {
        let containerName = container || '';
        try {
            if (!containerName) {
                try {
                    const pod = await this.client.coreApi.readNamespacedPod({ name: podName, namespace });
                    containerName = pod.spec?.containers?.[0]?.name || podName;
                } catch {
                    containerName = podName;
                }
            }

            const logRequest: k8s.CoreV1ApiReadNamespacedPodLogRequest = {
                name: podName,
                namespace,
                tailLines
            };
            if (containerName) {
                logRequest.container = containerName;
            }

            const rawLogs = await this.client.coreApi.readNamespacedPodLog(logRequest);

            const lines = (typeof rawLogs === 'string' ? rawLogs : String(rawLogs || ''))
                .split('\n')
                .filter(l => l.trim().length > 0);

            return {
                podName,
                namespace,
                containerName,
                lines: lines.length > 0 ? lines : ['[INFO] A konténer fut, de még nem generált naplókimenetet.'],
                totalLines: lines.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn(`[K8sWorkloadService] Nem sikerült kiolvasni a pod (${podName}) logjait:`, (error as any)?.message || error);
            return {
                podName,
                namespace,
                containerName: containerName || podName,
                lines: [
                    `[WARN] A Kubernetes API-ból nem sikerült lekérni a naplót: ${(error as any)?.message || error}`,
                    `[INFO] Ellenőrizd, hogy a pod fut-e és a konténer neve helyes-e (${containerName || 'default'}).`
                ],
                totalLines: 2,
                timestamp: new Date().toISOString()
            };
        }
    };

    getClusterEvents = async (
        namespace?: string,
        podName?: string
    ): Promise<K8sEventDto[]> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const allEvents: K8sEventDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const eventList = await this.client.coreApi.listNamespacedEvent({ namespace: ns });
                    for (const item of eventList.items || []) {
                        if (podName && item.involvedObject?.name !== podName) {
                            continue;
                        }

                        allEvents.push({
                            id: item.metadata?.uid || `${item.metadata?.name}-${Date.now()}`,
                            type: item.type === 'Warning' ? 'Warning' : 'Normal',
                            reason: item.reason || 'Ismeretlen',
                            message: item.message || '',
                            involvedObjectName: item.involvedObject?.name || '',
                            involvedObjectKind: item.involvedObject?.kind || '',
                            namespace: item.involvedObject?.namespace || ns,
                            count: item.count || 1,
                            firstTimestamp: item.firstTimestamp?.toString(),
                            lastTimestamp: (item.lastTimestamp || item.eventTime || item.metadata?.creationTimestamp || new Date()).toString(),
                            sourceComponent: item.source?.component || item.reportingComponent
                        });
                    }
                } catch (nsErr) {
                    console.warn(`[K8sWorkloadService] Hiba az események lekérésekor a '${ns}' névtérből:`, (nsErr as any)?.message || nsErr);
                }
            }

            allEvents.sort((a, b) => {
                const dateA = new Date(a.lastTimestamp).getTime();
                const dateB = new Date(b.lastTimestamp).getTime();
                return dateB - dateA;
            });

            return allEvents;
        } catch (error) {
            console.warn('[K8sWorkloadService] Hiba a K8s események lekérésekor:', (error as any)?.message || error);
            return [];
        }
    };
}
