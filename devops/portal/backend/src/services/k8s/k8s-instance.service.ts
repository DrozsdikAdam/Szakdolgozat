import { K8sClientService } from "./k8s-client.service.js";
import { K8sAutoscalingService } from "./k8s-autoscaling.service.js";
import {
    DEFAULT_APP_NAMESPACE,
    DEFAULT_APP_NAME
} from "../../constants/namespace.constants.js";
import {
    ARGO_ROLLOUT_CRD,
    K8S_CONTENT_TYPES,
    INSTANCE_SIZE_MAP,
    DEFAULT_INSTANCE_RESOURCES
} from "../../constants/k8s.constants.js";
import type { InstanceSize } from "../../types/setup.types.js";

export class K8sInstanceService {
    private client: K8sClientService;
    private autoscalingService: K8sAutoscalingService;

    constructor() {
        this.client = K8sClientService.getInstance();
        this.autoscalingService = new K8sAutoscalingService();
    }

    applyInstanceSize = async (
        size: InstanceSize,
        namespace = DEFAULT_APP_NAMESPACE,
        deploymentName = DEFAULT_APP_NAME
    ): Promise<{ success: boolean; message: string }> => {
        const targetResources = INSTANCE_SIZE_MAP[size] ?? DEFAULT_INSTANCE_RESOURCES;

        try {
            const deployment = await this.client.appsApi.readNamespacedDeployment({ name: deploymentName, namespace });
            const container = deployment.spec?.template.spec?.containers?.[0];

            if (!container) {
                throw new Error(`Konténer nem található a(z) ${deploymentName} deploymentben`);
            }

            container.resources = {
                requests: { cpu: targetResources.requests.cpu, memory: targetResources.requests.memory },
                limits: { cpu: targetResources.limits.cpu, memory: targetResources.limits.memory }
            };

            if (deployment.spec) {
                deployment.spec.replicas = 1;
            }

            await this.client.appsApi.replaceNamespacedDeployment({ name: deploymentName, namespace, body: deployment });
            console.log(`[K8sInstanceService] Statikus példányméret sikeresen alkalmazva (${size}) a(z) ${deploymentName} deploymentre.`);
            return { success: true, message: `Példányméret beállítva: ${size} (${targetResources.requests.cpu} / ${targetResources.requests.memory})` };
        } catch (error) {
            const candidateNames = [deploymentName, `${deploymentName}-bluegreen`, `${deploymentName}-canary`];
            const targetRolloutName = await this.resolveActiveRolloutName(deploymentName, namespace, candidateNames);
            const namesToTry = targetRolloutName ? [targetRolloutName] : candidateNames;
            const customApi = this.client.customObjectsApi as any;
            let lastError: any = null;

            for (const roName of namesToTry) {
                try {
                    const rolloutObj = await customApi.getNamespacedCustomObject({
                        group: ARGO_ROLLOUT_CRD.GROUP,
                        version: ARGO_ROLLOUT_CRD.VERSION,
                        namespace,
                        plural: ARGO_ROLLOUT_CRD.PLURAL,
                        name: roName
                    });
                    const containerName = rolloutObj?.spec?.template?.spec?.containers?.[0]?.name || "backend";

                    await customApi.patchNamespacedCustomObject({
                        group: ARGO_ROLLOUT_CRD.GROUP,
                        version: ARGO_ROLLOUT_CRD.VERSION,
                        namespace,
                        plural: ARGO_ROLLOUT_CRD.PLURAL,
                        name: roName,
                        body: {
                            spec: {
                                template: {
                                    spec: {
                                        containers: [
                                            {
                                                name: containerName,
                                                resources: {
                                                    requests: { cpu: targetResources.requests.cpu, memory: targetResources.requests.memory },
                                                    limits: { cpu: targetResources.limits.cpu, memory: targetResources.limits.memory }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }, { headers: { "content-type": K8S_CONTENT_TYPES.MERGE_PATCH } });

                    console.log(`[K8sInstanceService] Statikus példányméret sikeresen alkalmazva (${size}) a(z) ${roName} Rolloutra.`);
                    return { success: true, message: `Példányméret beállítva a Rolloutra (${roName}): ${size} (${targetResources.requests.cpu} / ${targetResources.requests.memory})` };
                } catch (roErr: any) {
                    lastError = roErr;
                    const statusCode = roErr?.response?.statusCode || roErr?.statusCode || roErr?.code;
                    if (statusCode === 404) {
                        continue;
                    }
                    console.warn(`[K8sInstanceService] Hiba történt a(z) '${roName}' Rollout méretezése közben:`, roErr?.message || roErr);
                }
            }

            console.warn(`[K8sInstanceService] Nem sikerült frissíteni a példányméretet (${size}) a K8s-ban:`, (lastError || error as any)?.message || error);
            return { success: false, message: `Példányméret beállítás figyelmeztetés: ${(lastError || error as any)?.message || error}` };
        }
    };

    private resolveActiveRolloutName = async (name: string, namespace: string, candidateNames: string[]): Promise<string | null> => {
        try {
            const customApi = this.client.customObjectsApi as any;
            const listRes = await customApi.listNamespacedCustomObject({
                group: ARGO_ROLLOUT_CRD.GROUP,
                version: ARGO_ROLLOUT_CRD.VERSION,
                namespace,
                plural: ARGO_ROLLOUT_CRD.PLURAL
            });
            const items = listRes?.items || listRes?.body?.items || [];
            const found = items.find((ro: any) =>
                candidateNames.includes(ro.metadata?.name) ||
                ro.metadata?.labels?.["app.kubernetes.io/name"] === name ||
                ro.metadata?.labels?.["app"] === name
            );
            return found?.metadata?.name || null;
        } catch (listErr) {
            console.warn(`[K8sInstanceService] Rollout lista lekérdezése sikertelen, jelölt nevek próbálgatása:`, (listErr as any)?.message || listErr);
            return null;
        }
    };

    private scaleRollout = async (name: string, namespace: string, replicas: number): Promise<{ success: boolean; message: string }> => {
        const candidateNames = [name, `${name}-bluegreen`, `${name}-canary`];
        const targetRolloutName = await this.resolveActiveRolloutName(name, namespace, candidateNames);
        const namesToTry = targetRolloutName ? [targetRolloutName] : candidateNames;
        const customApi = this.client.customObjectsApi as any;
        let lastError: any = null;

        for (const roName of namesToTry) {
            try {
                await customApi.patchNamespacedCustomObject({
                    group: ARGO_ROLLOUT_CRD.GROUP,
                    version: ARGO_ROLLOUT_CRD.VERSION,
                    namespace,
                    plural: ARGO_ROLLOUT_CRD.PLURAL,
                    name: roName,
                    body: { spec: { replicas } }
                }, { headers: { "content-type": K8S_CONTENT_TYPES.MERGE_PATCH } });

                await this.autoscalingService.syncRelatedHpa(roName, namespace, replicas);
                if (name !== roName) {
                    await this.autoscalingService.syncRelatedHpa(name, namespace, replicas);
                }

                return { success: true, message: `Rollout (${roName}) sikeresen átméretezve (${replicas})` };
            } catch (err: any) {
                lastError = err;
                const statusCode = err?.response?.statusCode || err?.statusCode || err?.code;
                if (statusCode === 404) continue;
                console.warn(`[K8sInstanceService] Hiba történt a(z) '${roName}' Rollout skálázása közben:`, err?.message || err);
            }
        }

        throw lastError || new Error(`Nem található aktív Rollout a megadott néven (${name})`);
    };

    scaleDeployment = async (name: string, namespace: string, replicas: number): Promise<{ success: boolean; message: string }> => {
        try {
            const deployment = await this.client.appsApi.readNamespacedDeployment({ name, namespace });
            if (!deployment.spec) {
                return { success: false, message: `Deployment spec nem található: ${name}` };
            }

            deployment.spec.replicas = replicas;
            await this.client.appsApi.replaceNamespacedDeployment({ name, namespace, body: deployment });

            await this.autoscalingService.syncRelatedHpa(name, namespace, replicas);

            return { success: true, message: `Deployment (${name}) sikeresen átméretezve (${replicas})` };
        } catch (error) {
            try {
                return await this.scaleRollout(name, namespace, replicas);
            } catch (roError) {
                console.warn(`[K8sInstanceService] Nem sikerült átméretezni sem Deploymentként, sem Rolloutként (${name}):`, (roError as any)?.message || roError);
                return { success: false, message: `Átméretezési hiba: ${(roError as any)?.message || (error as any)?.message || error}` };
            }
        }
    };

    scaleStatefulSet = async (name: string, namespace: string, replicas: number): Promise<{ success: boolean; message: string }> => {
        try {
            const sts = await this.client.appsApi.readNamespacedStatefulSet({ name, namespace });
            if (!sts.spec) {
                return { success: false, message: `StatefulSet spec nem található: ${name}` };
            }

            sts.spec.replicas = replicas;
            await this.client.appsApi.replaceNamespacedStatefulSet({ name, namespace, body: sts });
            return { success: true, message: `StatefulSet (${name}) sikeresen átméretezve (${replicas})` };
        } catch (error) {
            console.warn(`[K8sInstanceService] Nem sikerült átméretezni a StatefulSetet (${name}):`, (error as any)?.message || error);
            return { success: false, message: `Átméretezési figyelmeztetés: ${(error as any)?.message || error}` };
        }
    };

    setCronJobSuspended = async (name: string, namespace: string, suspended: boolean): Promise<{ success: boolean; message: string }> => {
        try {
            const cronJob = await this.client.batchApi.readNamespacedCronJob({ name, namespace });
            if (!cronJob.spec) {
                return { success: false, message: `CronJob spec nem található: ${name}` };
            }

            cronJob.spec.suspend = suspended;
            await this.client.batchApi.replaceNamespacedCronJob({ name, namespace, body: cronJob });
            return { success: true, message: `CronJob (${name}) sikeresen felfüggesztve (${suspended})` };
        } catch (error) {
            console.warn(`[K8sInstanceService] Nem sikerült felfüggeszteni a CronJobot (${name}):`, (error as any)?.message || error);
            return { success: false, message: `Felfüggesztési figyelmeztetés: ${(error as any)?.message || error}` };
        }
    };
}
