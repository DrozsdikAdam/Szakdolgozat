import { K8sClientService } from "./k8s-client.service.js";
import {
    DEFAULT_APP_NAMESPACE,
    DEFAULT_HPA_NAME,
    DEFAULT_VPA_NAME
} from "../../constants/namespace.constants.js";
import { HPA_DEFAULTS } from "../../constants/k8s.constants.js";
import type {
    UpdateHpaDto,
    UpdateVpaDto,
    VpaOverviewDto
} from "../../dtos/k8s.dto.js";

export class K8sAutoscalingService {
    private client: K8sClientService;

    constructor() {
        this.client = K8sClientService.getInstance();
    }

    getHpa = async (namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_HPA_NAME): Promise<UpdateHpaDto> => {
        try {
            const hpa = await this.client.autoscalingApi.readNamespacedHorizontalPodAutoscaler({
                name,
                namespace,
            });

            return {
                minReplicas: hpa.spec?.minReplicas ?? 0,
                maxReplicas: hpa.spec?.maxReplicas ?? 0,
                currentReplicas: hpa.status?.currentReplicas ?? 0,
                targetCpuUtil: hpa.spec?.targetCPUUtilizationPercentage ?? 0,
                currentCpuPercent: hpa.status?.currentCPUUtilizationPercentage ?? 0
            };
        } catch (error) {
            console.warn("[K8sAutoscalingService] HPA nem található vagy hiba történt:", (error as any)?.message || error);
            return {
                minReplicas: 0,
                maxReplicas: 0,
                currentReplicas: 0,
                targetCpuUtil: 0,
                currentCpuPercent: 0
            };
        }
    };

    updateHpa = async (request: UpdateHpaDto, namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_HPA_NAME): Promise<void> => {
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
            console.error("[K8sAutoscalingService] Error updating HPA:", error);
            throw error;
        }
    };

    getVpa = async (namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_VPA_NAME): Promise<VpaOverviewDto> => {
        try {
            const vpa = await this.client.customObjectsApi.getNamespacedCustomObject({
                group: "autoscaling.k8s.io",
                version: "v1",
                namespace,
                plural: "verticalpodautoscalers",
                name
            }) as any;

            const updateMode = (vpa.spec?.updatePolicy?.updateMode ?? "Off") as "Auto" | "Off";
            const containerPolicy = vpa.spec?.resourcePolicy?.containerPolicies?.[0];
            const min = containerPolicy?.minAllowed;
            const max = containerPolicy?.maxAllowed;
            const recommendation = vpa.status?.recommendation?.containerRecommendations?.[0]?.target;

            const dto: VpaOverviewDto = {
                name,
                updateMode
            };
            if (min?.cpu) dto.minAllowedCpu = min.cpu;
            if (min?.memory) dto.minAllowedMemory = min.memory;
            if (max?.cpu) dto.maxAllowedCpu = max.cpu;
            if (max?.memory) dto.maxAllowedMemory = max.memory;
            if (recommendation?.cpu) dto.targetCpu = recommendation.cpu;
            if (recommendation?.memory) dto.targetMemory = recommendation.memory;

            return dto;
        } catch (error) {
            console.warn("[K8sAutoscalingService] VPA nem érhető el vagy nem található:", (error as any)?.message || error);
            return {
                name,
                updateMode: "Off"
            };
        }
    };

    updateVpa = async (request: UpdateVpaDto, namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_VPA_NAME): Promise<void> => {
        try {
            const vpa = await this.client.customObjectsApi.getNamespacedCustomObject({
                group: "autoscaling.k8s.io",
                version: "v1",
                namespace,
                plural: "verticalpodautoscalers",
                name
            }) as any;

            if (!vpa.spec) throw new Error("Invalid VPA spec");

            const policy = vpa.spec.resourcePolicy?.containerPolicies?.[0];
            if (!policy) throw new Error("Invalid container policy");

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
                group: "autoscaling.k8s.io",
                version: "v1",
                namespace,
                plural: "verticalpodautoscalers",
                name,
                body: vpa
            });
        } catch (error) {
            console.error("[K8sAutoscalingService] Error updating VPA:", error);
            throw error;
        }
    };

    syncRelatedHpa = async (targetName: string, namespace: string, replicas: number): Promise<void> => {
        try {
            const hpaListRes = await this.client.autoscalingApi.listNamespacedHorizontalPodAutoscaler({ namespace });
            const hpas = hpaListRes.items || [];

            const relatedHpa = hpas.find((h) =>
                h.spec?.scaleTargetRef?.name === targetName ||
                h.metadata?.name === `${targetName}-hpa` ||
                (targetName.includes("-") && h.metadata?.name === `${targetName.split("-")[0]}-${targetName.split("-")[1]}-hpa`)
            );

            if (!relatedHpa?.metadata?.name || !relatedHpa.spec) {
                return;
            }

            const hpaName = relatedHpa.metadata.name;

            if (replicas === 0) {
                if (relatedHpa.spec.minReplicas === 0) {
                    return;
                }
                relatedHpa.spec.minReplicas = 0;
                await this.client.autoscalingApi.replaceNamespacedHorizontalPodAutoscaler({
                    name: hpaName,
                    namespace,
                    body: relatedHpa
                });
                console.log(`[K8sAutoscalingService] Kapcsolódó HPA (${hpaName}) Scale-to-Zero állapotra állítva (minReplicas: 0)`);
                return;
            }

            const currentMin = relatedHpa.spec.minReplicas ?? HPA_DEFAULTS.DEFAULT_MIN_REPLICAS;
            const currentMax = relatedHpa.spec.maxReplicas ?? HPA_DEFAULTS.DEFAULT_MAX_REPLICAS;
            let updated = false;

            if (currentMin === 0 || replicas < currentMin) {
                relatedHpa.spec.minReplicas = Math.max(1, replicas);
                updated = true;
            }

            if (replicas > currentMax) {
                relatedHpa.spec.maxReplicas = replicas;
                updated = true;
            }

            if (!updated) {
                return;
            }

            await this.client.autoscalingApi.replaceNamespacedHorizontalPodAutoscaler({
                name: hpaName,
                namespace,
                body: relatedHpa
            });
            console.log(`[K8sAutoscalingService] Kapcsolódó HPA (${hpaName}) szinkronizálva (minReplicas: ${relatedHpa.spec.minReplicas}, maxReplicas: ${relatedHpa.spec.maxReplicas})`);
        } catch (error) {
            console.warn(`[K8sAutoscalingService] Nem sikerült szinkronizálni a kapcsolódó HPA-t (${targetName}):`, (error as any)?.message || error);
        }
    };
}
