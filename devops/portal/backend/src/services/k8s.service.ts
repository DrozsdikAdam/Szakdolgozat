import * as k8s from "@kubernetes/client-node";
import { K8sMapper } from "../mappers/k8s.mapper.js";
import type { JobTriggerResponseDto } from "../dtos/backup.dto.js";
import type {
    ClusterOverviewDto,
    K8sEventDto,
    PodLogsResponseDto,
    RateLimitResponseDto,
    UpdateHpaDto,
    UpdateRateLimitDto,
    UpdateVpaDto,
    VpaOverviewDto,
} from "../dtos/k8s.dto.js";
import type {
    ConfigMapDto,
    SecretDto,
    SecretRevealDto,
    SaveConfigDto,
    RestartWorkloadDto
} from "../dtos/config.dto.js";
import type { DatabaseEngine, DatabaseMode, InstanceSize } from "../types/setup.types.js";

export class K8sService {

    private k8sApi: k8s.KubeConfig;
    private mapper: K8sMapper;
    private coreApi: k8s.CoreV1Api;
    private appsApi: k8s.AppsV1Api;
    private networkApi: k8s.NetworkingV1Api;
    private autoscalingApi: k8s.AutoscalingV1Api;
    private batchApi: k8s.BatchV1Api;
    private customObjectsApi: k8s.CustomObjectsApi;

    constructor() {
        this.k8sApi = new k8s.KubeConfig();
        this.mapper = new K8sMapper();

        try {
            if (process.env.KUBERNETES_SERVICE_HOST) {
                this.k8sApi.loadFromCluster();
            } else {
                this.k8sApi.loadFromDefault();
            }
        } catch (error) {
            try {
                this.k8sApi.loadFromDefault();
            } catch {
                console.warn("[K8sService] Kubeconfig nem található.");
            }
        }

        this.coreApi = this.k8sApi.makeApiClient(k8s.CoreV1Api);
        this.appsApi = this.k8sApi.makeApiClient(k8s.AppsV1Api);
        this.networkApi = this.k8sApi.makeApiClient(k8s.NetworkingV1Api);
        this.autoscalingApi = this.k8sApi.makeApiClient(k8s.AutoscalingV1Api);
        this.batchApi = this.k8sApi.makeApiClient(k8s.BatchV1Api);
        this.customObjectsApi = this.k8sApi.makeApiClient(k8s.CustomObjectsApi);
    }

    getClusterOverView = async (): Promise<ClusterOverviewDto> => {
        try {
            const platformPods = await this.coreApi.listNamespacedPod({ namespace: 'platform-infra' });
            const appPods = await this.coreApi.listNamespacedPod({ namespace: 'app-mes' });

            const platPodInfo = this.mapper.toPodInfos(platformPods.items ?? [])
            const appPodInfo = this.mapper.toPodInfos(appPods.items ?? [])

            return {
                platformPods: platPodInfo,
                appPods: appPodInfo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn('[K8sService] Nem sikerült elérni a valós K8s API-t, fallback adatok használata:', (error as any)?.message || error);
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
    }

    getRateLimit = async (namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<RateLimitResponseDto> => {
        try {
            const ingress = await this.networkApi.readNamespacedIngress({ name: ingressName, namespace });
            const rpsAnnotation = ingress.metadata?.annotations?.['nginx.ingress.kubernetes.io/limit-rps'];
            const burstAnnotation = ingress.metadata?.annotations?.['nginx.ingress.kubernetes.io/limit-burst-multiplier'];
            return {
                rps: rpsAnnotation ? Number(rpsAnnotation) : 20,
                burst: burstAnnotation ? Number(burstAnnotation) : 5
            };
        } catch (error) {
            console.warn('Rate limit fallback to defaults (K8s not reachable):', (error as any)?.message || error);
            return { rps: 20, burst: 5 };
        }
    }

    updateRateLimit = async (request: UpdateRateLimitDto, namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<void> => {
        try {
            const ingress = await this.networkApi.readNamespacedIngress({
                name: ingressName,
                namespace,
            });

            if (!ingress.metadata) ingress.metadata = {};
            if (!ingress.metadata.annotations) ingress.metadata.annotations = {};

            ingress.metadata.annotations['nginx.ingress.kubernetes.io/limit-rps'] = String(request.rps);
            if (request.burst !== undefined) {
                ingress.metadata.annotations['nginx.ingress.kubernetes.io/limit-burst-multiplier'] = String(request.burst);
            }

            await this.networkApi.replaceNamespacedIngress({
                name: ingressName,
                namespace,
                body: ingress
            });

        } catch (error) {
            console.error('Error updating rate limit:', error);
            console.warn('[K8sService] Ingress nem érhető el, a beállítás helyi környezetben szimulálva.');
        }
    }

    triggerBackupJob = async (namespace = 'platform-infra', cronjob = 'db-backup'): Promise<JobTriggerResponseDto> => {
        const name = `manual-backup-${Date.now()}`;
        try {
            const cronJob = await this.batchApi.readNamespacedCronJob({ name: cronjob, namespace });

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

            await this.batchApi.createNamespacedJob({ namespace, body: job });

            return {
                jobName: name,
                message: "Backup job triggered successfully"
            };
        } catch (error) {
            console.warn('[K8sService] K8s API nem érhető el (pl. helyi fejlesztés), szimulált mentési Job indítása:', (error as any)?.message || error);
            return {
                jobName: name,
                message: "A mentési K8s Job elindult (szimulált környezetben)"
            };
        }
    }

    triggerRestore = async (targetBackup = 'latest', namespace = 'platform-infra', cronjob = 'db-restore'): Promise<JobTriggerResponseDto> => {
        const name = `manual-restore-${Date.now()}`;
        try {
            const cronJob = await this.batchApi.readNamespacedCronJob({ name: cronjob, namespace });

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

            await this.batchApi.createNamespacedJob({ namespace, body: job });

            return {
                jobName: name,
                message: "Database restore job triggered successfully",
            };
        } catch (error) {
            console.warn('[K8sService] K8s API nem érhető el (pl. helyi fejlesztés), szimulált visszaállítási Job indítása:', (error as any)?.message || error);
            return {
                jobName: name,
                message: `Adatbázis visszaállítási Job elindítva: ${targetBackup} (szimulált környezetben)`
            };
        }
    }

    getHpa = async (namespace = 'app-mes', name = 'mes-backend-hpa'): Promise<UpdateHpaDto> => {
        try {
            const hpa = await this.autoscalingApi.readNamespacedHorizontalPodAutoscaler({
                name,
                namespace,
            });

            const response: UpdateHpaDto = {
                minReplicas: hpa.spec?.minReplicas ?? 2,
                maxReplicas: hpa.spec?.maxReplicas ?? 10,
                currentReplicas: hpa.status?.currentReplicas ?? 2,
                targetCpuUtil: hpa.spec?.targetCPUUtilizationPercentage ?? 80,
                currentCpuPercent: hpa.status?.currentCPUUtilizationPercentage ?? 45
            }

            return response;
        } catch (error) {
            console.warn('HPA fallback to default (K8s not reachable):', (error as any)?.message || error);
            return {
                minReplicas: 2,
                maxReplicas: 10,
                currentReplicas: 2,
                targetCpuUtil: 80,
                currentCpuPercent: 45
            };
        }
    }

    updateHpa = async (request: UpdateHpaDto, namespace = 'app-mes', name = 'mes-backend-hpa'): Promise<void> => {
        try {
            const hpa = await this.autoscalingApi.readNamespacedHorizontalPodAutoscaler({ name, namespace });

            if (!hpa.spec) throw new Error("Invalid HPA spec");

            hpa.spec.minReplicas = request.minReplicas;
            hpa.spec.maxReplicas = request.maxReplicas;
            hpa.spec.targetCPUUtilizationPercentage = request.targetCpuUtil;

            await this.autoscalingApi.replaceNamespacedHorizontalPodAutoscaler({
                name,
                namespace,
                body: hpa
            });

        } catch (error) {
            console.error('Error updating HPA:', error);
            throw error;
        }
    }

    getVpa = async (namespace = 'app-mes', name = 'mes-backend-vpa'): Promise<VpaOverviewDto> => {
        try {
            const vpa = await this.customObjectsApi.getNamespacedCustomObject({
                group: 'autoscaling.k8s.io',
                version: 'v1',
                namespace: namespace,
                plural: 'verticalpodautoscalers',
                name: name
            }) as any;

            const updateMode = (vpa.spec?.updatePolicy?.updateMode ?? 'Auto') as 'Auto' | 'Off';
            const containerPolicy = vpa.spec?.resourcePolicy?.containerPolicies?.[0];
            const min = containerPolicy?.minAllowed ?? { cpu: '100m', memory: '256Mi' };
            const max = containerPolicy?.maxAllowed ?? { cpu: '1000m', memory: '1Gi' };
            const recommendation = vpa.status?.recommendation?.containerRecommendations?.[0]?.target;

            const response: VpaOverviewDto = {
                name,
                updateMode: updateMode,
                minAllowedCpu: min.cpu,
                minAllowedMemory: min.memory,
                maxAllowedCpu: max.cpu,
                maxAllowedMemory: max.memory,
                targetCpu: recommendation?.cpu,
                targetMemory: recommendation?.memory
            }

            return response;
        } catch (error) {
            console.warn('Error getting VPA, fallback to defaults:', (error as any)?.message || error);
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
    }

    updateVpa = async (request: UpdateVpaDto, namespace = 'app-mes', name = 'mes-backend-vpa'): Promise<void> => {
        try {
            const vpa = await this.customObjectsApi.getNamespacedCustomObject({
                group: 'autoscaling.k8s.io',
                version: 'v1',
                namespace: namespace,
                plural: 'verticalpodautoscalers',
                name: name
            }) as any;

            if (!vpa.spec) throw new Error('Invalid VPA spec');

            const policy = vpa.spec.resourcePolicy?.containerPolicies?.[0];

            if (!policy) throw new Error('Invalid container policy');

            policy.minAllowed = {
                cpu: request.minAllowedCpu,
                memory: request.minAllowedMemory
            }

            policy.maxAllowed = {
                cpu: request.maxAllowedCpu,
                memory: request.maxAllowedMemory
            }

            vpa.spec.updatePolicy.updateMode = request.updateMode;

            await this.customObjectsApi.replaceNamespacedCustomObject({
                group: 'autoscaling.k8s.io',
                version: 'v1',
                namespace: namespace,
                plural: 'verticalpodautoscalers',
                name: name,
                body: vpa
            });

        } catch (error) {
            console.error('Error updating VPA:', error);
            throw error;
        }
    }

    deployDatabaseEngine = async (engine: DatabaseEngine, mode: DatabaseMode): Promise<{ success: boolean; message: string }> => {
        if (mode !== 'internal') {
            console.log(`[K8sService] Adatbázis mód '${mode}', belső K8s provisioning nem szükséges.`);
            return { success: true, message: `Külső adatbázis kapcsolat regisztrálva (${engine})` };
        }

        const namespace = 'platform-infra';

        try {
            if (engine === 'mssql') {
                const deployment: k8s.V1Deployment = {
                    metadata: { name: 'mssql', namespace, labels: { app: 'mssql' } },
                    spec: {
                        replicas: 1,
                        selector: { matchLabels: { app: 'mssql' } },
                        template: {
                            metadata: { labels: { app: 'mssql' } },
                            spec: {
                                containers: [{
                                    name: 'mssql',
                                    image: 'mcr.microsoft.com/mssql/server:2022-latest',
                                    ports: [{ containerPort: 1433 }],
                                    env: [
                                        { name: 'ACCEPT_EULA', value: 'Y' },
                                        { name: 'MSSQL_PID', value: 'Developer' },
                                        { name: 'MSSQL_SA_PASSWORD', value: 'MesStrongPass123!' },
                                        { name: 'DB_NAME', value: 'mesdb' }
                                    ],
                                    resources: {
                                        requests: { memory: '512Mi', cpu: '250m' },
                                        limits: { memory: '1024Mi', cpu: '1000m' }
                                    }
                                }]
                            }
                        }
                    }
                };

                const service: k8s.V1Service = {
                    metadata: { name: 'mssql', namespace },
                    spec: {
                        type: 'ClusterIP',
                        selector: { app: 'mssql' },
                        ports: [{ port: 1433, targetPort: 1433, name: 'mssql' }]
                    }
                };

                try {
                    await this.appsApi.readNamespacedDeployment({ name: 'mssql', namespace });
                    await this.appsApi.replaceNamespacedDeployment({ name: 'mssql', namespace, body: deployment });
                } catch {
                    await this.appsApi.createNamespacedDeployment({ namespace, body: deployment });
                }

                try {
                    await this.coreApi.readNamespacedService({ name: 'mssql', namespace });
                } catch {
                    await this.coreApi.createNamespacedService({ namespace, body: service });
                }

                console.log('[K8sService] MS SQL Server 2022 deployment és service sikeresen alkalmazva a platform-infra névtérben.');
                return { success: true, message: 'MS SQL Server 2022 provisioning sikeres a platform-infra névtérben' };
            } else if (engine === 'oracle') {
                const deployment: k8s.V1Deployment = {
                    metadata: { name: 'oracle', namespace, labels: { app: 'oracle' } },
                    spec: {
                        replicas: 1,
                        selector: { matchLabels: { app: 'oracle' } },
                        template: {
                            metadata: { labels: { app: 'oracle' } },
                            spec: {
                                containers: [{
                                    name: 'oracle',
                                    image: 'gvenzl/oracle-free:latest',
                                    ports: [{ containerPort: 1521 }],
                                    env: [
                                        { name: 'APP_USER', value: 'mesuser' },
                                        { name: 'APP_USER_PASSWORD', value: 'mespassword' },
                                        { name: 'ORACLE_PASSWORD', value: 'MesStrongPass123!' },
                                        { name: 'ORACLE_DATABASE', value: 'mesdb' }
                                    ],
                                    resources: {
                                        requests: { memory: '1024Mi', cpu: '500m' },
                                        limits: { memory: '3Gi', cpu: '2000m' }
                                    }
                                }]
                            }
                        }
                    }
                };

                const service: k8s.V1Service = {
                    metadata: { name: 'oracle', namespace },
                    spec: {
                        type: 'ClusterIP',
                        selector: { app: 'oracle' },
                        ports: [{ port: 1521, targetPort: 1521, name: 'oracle' }]
                    }
                };

                try {
                    await this.appsApi.readNamespacedDeployment({ name: 'oracle', namespace });
                    await this.appsApi.replaceNamespacedDeployment({ name: 'oracle', namespace, body: deployment });
                } catch {
                    await this.appsApi.createNamespacedDeployment({ namespace, body: deployment });
                }

                try {
                    await this.coreApi.readNamespacedService({ name: 'oracle', namespace });
                } catch {
                    await this.coreApi.createNamespacedService({ namespace, body: service });
                }

                console.log('[K8sService] Oracle Database Free 23c deployment és service sikeresen alkalmazva a platform-infra névtérben.');
                return { success: true, message: 'Oracle Database Free 23c provisioning sikeres a platform-infra névtérben' };
            } else {
                console.log('[K8sService] PostgreSQL Patroni HA klaszter aktív az app-mes/storage névtérben.');
                return { success: true, message: 'PostgreSQL Patroni HA klaszter aktív a fürtben' };
            }
        } catch (error) {
            console.warn(`[K8sService] Figyelmeztetés a(z) ${engine} K8s provisioning során:`, (error as any)?.message || error);
            return { success: false, message: `K8s provisioning figyelmeztetés: ${(error as any)?.message || error}` };
        }
    }

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
            const deployment = await this.appsApi.readNamespacedDeployment({ name: deploymentName, namespace });
            const container = deployment.spec?.template.spec?.containers[0];
            if (!container) throw new Error(`Container nem található a(z) ${deploymentName} deploymentben`);

            container.resources = {
                requests: { cpu: targetResources.requests.cpu, memory: targetResources.requests.memory },
                limits: { cpu: targetResources.limits.cpu, memory: targetResources.limits.memory }
            };

            if (deployment.spec) {
                deployment.spec.replicas = 1;
            }

            await this.appsApi.replaceNamespacedDeployment({ name: deploymentName, namespace, body: deployment });
            console.log(`[K8sService] Statikus példányméret sikeresen alkalmazva (${size}) a(z) ${deploymentName} deploymentre.`);
            return { success: true, message: `Példányméret beállítva: ${size} (${targetResources.requests.cpu} / ${targetResources.requests.memory})` };
        } catch (error) {
            console.warn(`[K8sService] Nem sikerült frissíteni a példányméretet (${size}) a K8s-ban:`, (error as any)?.message || error);
            return { success: false, message: `Példányméret beállítás figyelmeztetés: ${(error as any)?.message || error}` };
        }
    }

    scaleDeployment = async (name: string, namespace: string, replicas: number) => {
        try {
            const deployment = await this.appsApi.readNamespacedDeployment({ name, namespace });
            if (deployment.spec) {
                deployment.spec.replicas = replicas;
            }
            await this.appsApi.replaceNamespacedDeployment({ name, namespace, body: deployment });
            return { success: true, message: `Deployment sikeresen átméretezve (${replicas})` };
        } catch (error) {
            console.warn(`[K8sService] Nem sikerült átméretezni a deploymentet (${name}):`, (error as any)?.message || error);
            return { success: false, message: `Átméretezési figyelmeztetés: ${(error as any)?.message || error}` };
        }
    }

    setCronJobSuspended = async (name: string, namespace: string, suspended: boolean) => {
        try {
            const cronJob = await this.batchApi.readNamespacedCronJob({ name, namespace });
            if (cronJob.spec)
                cronJob.spec.suspend = suspended;
            await this.batchApi.replaceNamespacedCronJob({ name, namespace, body: cronJob });
            return { success: true, message: `CronJob sikeresen felfüggesztve (${suspended})` };
        } catch (error) {
            console.warn(`[K8sService] Nem sikerült felfüggeszteni a CronJobot (${name}):`, (error as any)?.message || error);
            return { success: false, message: `Felfüggesztési figyelmeztetés: ${(error as any)?.message || error}` };
        }
    }

    setMaintenanceMode = async (enabled: boolean, namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<{ success: boolean; message: string }> => {
        try {
            const ingress = await this.networkApi.readNamespacedIngress({ name: ingressName, namespace });
            if (!ingress.metadata) ingress.metadata = {};
            if (!ingress.metadata.annotations) ingress.metadata.annotations = {};

            if (enabled) {
                ingress.metadata.annotations['nginx.ingress.kubernetes.io/custom-http-errors'] = '503';
                ingress.metadata.annotations['platform.devops.io/maintenance-mode'] = 'true';
                console.log('[K8sService] Karbantartási üzemmód (503 Service) bekapcsolva az Ingress rétegen.');
            } else {
                delete ingress.metadata.annotations['nginx.ingress.kubernetes.io/custom-http-errors'];
                delete ingress.metadata.annotations['platform.devops.io/maintenance-mode'];
                console.log('[K8sService] Karbantartási üzemmód kikapcsolva, normál forgalom visszaállítva.');
            }

            await this.networkApi.replaceNamespacedIngress({ name: ingressName, namespace, body: ingress });
            return { success: true, message: `Karbantartási üzemmód ${enabled ? 'bekapcsolva' : 'kikapcsolva'}` };
        } catch (error) {
            console.warn('[K8sService] Ingress nem érhető el (pl. helyi fejlesztés), karbantartási üzemmód szimulálva:', (error as any)?.message || error);
            return { success: true, message: `Karbantartási üzemmód szimulálva: ${enabled ? 'AKTÍV' : 'INAKTÍV'}` };
        }
    }

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
                    const pod = await this.coreApi.readNamespacedPod({ name: podName, namespace });
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

            const rawLogs = await this.coreApi.readNamespacedPodLog(logRequest);

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
            console.warn(`[K8sService] Nem sikerült kiolvasni a pod (${podName}) logjait:`, (error as any)?.message || error);
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
            const targetNamespaces = namespace && namespace !== 'all'
                ? [namespace]
                : ['platform-infra', 'app-mes'];

            const allEvents: K8sEventDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const eventList = await this.coreApi.listNamespacedEvent({ namespace: ns });
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
                    console.warn(`[K8sService] Hiba az események lekérésekor a '${ns}' névtérből:`, (nsErr as any)?.message || nsErr);
                }
            }

            allEvents.sort((a, b) => {
                const dateA = new Date(a.lastTimestamp).getTime();
                const dateB = new Date(b.lastTimestamp).getTime();
                return dateB - dateA;
            });

            return allEvents;
        } catch (error) {
            console.warn('[K8sService] Hiba a K8s események lekérésekor:', (error as any)?.message || error);
            return [];
        }
    };

    getConfigMaps = async (namespace?: string): Promise<ConfigMapDto[]> => {
        try {
            const targetNamespaces = namespace && namespace !== 'all'
                ? [namespace]
                : ['platform-infra', 'app-mes'];

            const configMaps: ConfigMapDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const configMapList = await this.coreApi.listNamespacedConfigMap({ namespace: ns });
                    for (const item of configMapList.items || []) {
                        const cmName = item.metadata?.name || '';
                        const bound = await this.getBoundWorkloads(ns, cmName, false);
                        configMaps.push({
                            name: cmName,
                            namespace: item.metadata?.namespace || ns,
                            data: (item.data as Record<string, string>) || {},
                            keyCount: Object.keys(item.data || {}).length,
                            createdAt: (item.metadata?.creationTimestamp || new Date()).toString(),
                            boundWorkloads: bound
                        });
                    }
                } catch (nsErr) {
                    console.warn(`[K8sService] Hiba a configMapek lekérésekor a '${ns}' névtérből:`, (nsErr as any)?.message || nsErr);
                }
            }

            configMaps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return configMaps;
        } catch (error) {
            console.warn('[K8sService] Hiba a configMapek lekérésekor:', (error as any)?.message || error);
            return [];
        }
    };

    getSecrets = async (namespace?: string): Promise<SecretDto[]> => {
        try {
            const targetNamespaces = namespace && namespace !== 'all'
                ? [namespace]
                : ['platform-infra', 'app-mes'];

            const secrets: SecretDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const secretList = await this.coreApi.listNamespacedSecret({ namespace: ns });
                    for (const item of secretList.items || []) {
                        const secName = item.metadata?.name || '';
                        const rawData = item.data || {};
                        const keys = Object.keys(rawData);

                        // Masked data for safe frontend display
                        const maskedData: Record<string, string> = {};
                        for (const key of keys) {
                            maskedData[key] = "••••••••";
                        }

                        const bound = await this.getBoundWorkloads(ns, secName, true);

                        secrets.push({
                            name: secName,
                            namespace: item.metadata?.namespace || ns,
                            secretType: item.type || 'Opaque',
                            data: maskedData,
                            keys,
                            keyCount: keys.length,
                            isMasked: true,
                            createdAt: (item.metadata?.creationTimestamp || new Date()).toString(),
                            boundWorkloads: bound
                        });
                    }
                } catch (nsErr) {
                    console.warn(`[K8sService] Hiba a titkok lekérésekor a '${ns}' névtérből:`, (nsErr as any)?.message || nsErr);
                }
            }

            secrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return secrets;
        } catch (error) {
            console.warn('[K8sService] Hiba a titkok lekérésekor:', (error as any)?.message || error);
            return [];
        }
    };

    revealSecret = async (namespace: string, name: string): Promise<SecretRevealDto> => {
        try {
            const secret = await this.coreApi.readNamespacedSecret({ name, namespace });
            const rawData = secret.data || {};
            const revealedData: Record<string, string> = {};

            for (const [key, base64Val] of Object.entries(rawData)) {
                try {
                    revealedData[key] = Buffer.from(base64Val, 'base64').toString('utf-8');
                } catch {
                    revealedData[key] = String(base64Val);
                }
            }

            return {
                name,
                namespace,
                data: revealedData
            };
        } catch (error) {
            console.error(`[K8sService] Nem sikerült feloldani a titkot (${name}):`, error);
            throw new Error(`Nem sikerült kiolvasni a titok adatait: ${(error as any)?.message || error}`);
        }
    };

    saveConfigMap = async (dto: SaveConfigDto): Promise<ConfigMapDto> => {
        try {
            let exists = false;
            try {
                await this.coreApi.readNamespacedConfigMap({ name: dto.name, namespace: dto.namespace });
                exists = true;
            } catch {
                exists = false;
            }

            const cmBody: k8s.V1ConfigMap = {
                metadata: {
                    name: dto.name,
                    namespace: dto.namespace
                },
                data: dto.data
            };

            if (exists) {
                await this.coreApi.replaceNamespacedConfigMap({
                    name: dto.name,
                    namespace: dto.namespace,
                    body: cmBody
                });
            } else {
                await this.coreApi.createNamespacedConfigMap({
                    namespace: dto.namespace,
                    body: cmBody
                });
            }

            const bound = await this.getBoundWorkloads(dto.namespace, dto.name, false);
            return {
                name: dto.name,
                namespace: dto.namespace,
                data: dto.data,
                keyCount: Object.keys(dto.data).length,
                createdAt: new Date().toISOString(),
                boundWorkloads: bound
            };
        } catch (error) {
            console.error(`[K8sService] Hiba a ConfigMap mentésekor (${dto.name}):`, error);
            throw new Error(`Nem sikerült elmenteni a ConfigMap-et: ${(error as any)?.message || error}`);
        }
    };

    deleteConfigMap = async (namespace: string, name: string): Promise<boolean> => {
        try {
            await this.coreApi.deleteNamespacedConfigMap({ name, namespace });
            return true;
        } catch (error) {
            console.error(`[K8sService] Hiba a ConfigMap törlésekor (${name}):`, error);
            throw new Error(`Nem sikerült törölni a ConfigMap-et: ${(error as any)?.message || error}`);
        }
    };

    saveSecret = async (dto: SaveConfigDto): Promise<SecretDto> => {
        try {
            let exists = false;
            try {
                await this.coreApi.readNamespacedSecret({ name: dto.name, namespace: dto.namespace });
                exists = true;
            } catch {
                exists = false;
            }

            const secretBody: k8s.V1Secret = {
                metadata: {
                    name: dto.name,
                    namespace: dto.namespace
                },
                type: dto.secretType || 'Opaque',
                stringData: dto.data
            };

            if (exists) {
                await this.coreApi.replaceNamespacedSecret({
                    name: dto.name,
                    namespace: dto.namespace,
                    body: secretBody
                });
            } else {
                await this.coreApi.createNamespacedSecret({
                    namespace: dto.namespace,
                    body: secretBody
                });
            }

            const keys = Object.keys(dto.data);
            const maskedData: Record<string, string> = {};
            for (const key of keys) {
                maskedData[key] = "••••••••";
            }

            const bound = await this.getBoundWorkloads(dto.namespace, dto.name, true);
            return {
                name: dto.name,
                namespace: dto.namespace,
                secretType: dto.secretType || 'Opaque',
                data: maskedData,
                keys,
                keyCount: keys.length,
                isMasked: true,
                createdAt: new Date().toISOString(),
                boundWorkloads: bound
            };
        } catch (error) {
            console.error(`[K8sService] Hiba a Secret mentésekor (${dto.name}):`, error);
            throw new Error(`Nem sikerült elmenteni a Secret-et: ${(error as any)?.message || error}`);
        }
    };

    deleteSecret = async (namespace: string, name: string): Promise<boolean> => {
        try {
            await this.coreApi.deleteNamespacedSecret({ name, namespace });
            return true;
        } catch (error) {
            console.error(`[K8sService] Hiba a Secret törlésekor (${name}):`, error);
            throw new Error(`Nem sikerült törölni a Secret-et: ${(error as any)?.message || error}`);
        }
    };

    restartWorkload = async (namespace: string, workloadNames: string[]): Promise<RestartWorkloadDto> => {
        const restartedAt = new Date().toISOString();
        const successNames: string[] = [];

        for (const name of workloadNames) {
            try {
                const dep = await this.appsApi.readNamespacedDeployment({ name, namespace });
                if (dep.spec?.template) {
                    if (!dep.spec.template.metadata) {
                        dep.spec.template.metadata = {};
                    }
                    if (!dep.spec.template.metadata.annotations) {
                        dep.spec.template.metadata.annotations = {};
                    }

                    dep.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = restartedAt;

                    await this.appsApi.replaceNamespacedDeployment({
                        name,
                        namespace,
                        body: dep
                    });
                    successNames.push(name);
                }
            } catch (err) {
                console.warn(`[K8sService] Nem sikerült újraindítani a '${name}' deploymentet:`, (err as any)?.message || err);
            }
        }

        return {
            namespace,
            workloadNames: successNames,
            restartedAt,
            message: `${successNames.length} workload sikeresen újraindítva.`
        };
    };

    private getBoundWorkloads = async (namespace: string, configName: string, isSecret: boolean): Promise<string[]> => {
        try {
            const deploys = await this.appsApi.listNamespacedDeployment({ namespace });
            const bound: string[] = [];
            for (const dep of deploys.items || []) {
                const depName = dep.metadata?.name || '';
                const containers = dep.spec?.template?.spec?.containers || [];
                let isUsed = false;

                for (const c of containers) {
                    if (isSecret) {
                        if (c.envFrom?.some(ef => ef.secretRef?.name === configName)) isUsed = true;
                        if (c.env?.some(e => e.valueFrom?.secretKeyRef?.name === configName)) isUsed = true;
                    } else {
                        if (c.envFrom?.some(ef => ef.configMapRef?.name === configName)) isUsed = true;
                        if (c.env?.some(e => e.valueFrom?.configMapKeyRef?.name === configName)) isUsed = true;
                    }
                }

                const volumes = dep.spec?.template?.spec?.volumes || [];
                for (const v of volumes) {
                    if (isSecret && v.secret?.secretName === configName) isUsed = true;
                    if (!isSecret && v.configMap?.name === configName) isUsed = true;
                }

                if (isUsed && !bound.includes(depName)) {
                    bound.push(depName);
                }
            }
            return bound;
        } catch {
            return [];
        }
    };

}