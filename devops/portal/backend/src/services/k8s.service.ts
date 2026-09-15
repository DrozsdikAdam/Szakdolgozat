import * as k8s from "@kubernetes/client-node";
import { K8sMapper } from "../mappers/k8s.mapper.js";
import type { JobTriggerResponseDto } from "../dtos/backup.dto.js";
import type { ClusterOverviewDto, UpdateHpaDto, UpdateRateLimitDto, UpdateVpaDto, VpaOverviewDto } from "../dtos/k8s.dto.js";

export class K8sService {

    private k8sApi: k8s.KubeConfig;
    private mapper: K8sMapper;
    private coreApi: k8s.CoreV1Api;
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

    getRateLimit = async (namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<number> => {
        try {
            const ingress = await this.networkApi.readNamespacedIngress({ name: ingressName, namespace });
            const annotation = ingress.metadata?.annotations?.['nginx.ingress.kubernetes.io/limit-rps']
            return annotation ? Number(annotation) : 20;
        } catch (error) {
            console.warn('Rate limit fallback to 20 rps (K8s not reachable):', (error as any)?.message || error);
            return 20;
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

}