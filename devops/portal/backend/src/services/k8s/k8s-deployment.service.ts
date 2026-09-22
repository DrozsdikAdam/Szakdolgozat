import { K8sClientService } from "./k8s-client.service.js";
import {
    DEFAULT_GITOPS_REPO,
    DEFAULT_WORKLOAD_METADATA,
    type WorkloadMetadata
} from "../../constants/k8s-deployment.constants.js";
import type {
    GitRepoConfig,
    DeploymentStrategy
} from "../../types/deployment.dto.js";
import type { DeploymentsOverviewDto, RollbackDeploymentDto, UpdateDeploymentStrategyDto, WorkloadDeploymentDto } from "../../dtos/deployment.dto.js";

export class K8sDeploymentService {
    private client: K8sClientService;
    private gitRepo: GitRepoConfig;
    private workloadMeta: Map<string, WorkloadMetadata>;

    constructor(client?: K8sClientService) {
        this.client = client || K8sClientService.getInstance();
        this.gitRepo = { ...DEFAULT_GITOPS_REPO };
        this.workloadMeta = new Map(Object.entries(DEFAULT_WORKLOAD_METADATA));
    }

    getDeploymentsOverview = async (namespace?: string): Promise<DeploymentsOverviewDto> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const workloads: WorkloadDeploymentDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const deployList = await this.client.appsApi.listNamespacedDeployment({ namespace: ns });

                    for (const dep of deployList.items || []) {
                        const depName = dep.metadata?.name || "";
                        const container = dep.spec?.template?.spec?.containers?.[0];
                        if (!container) continue;

                        const meta = this.getOrCreateMetadata(ns, depName, dep);
                        const desired = dep.spec?.replicas ?? 1;
                        const current = dep.status?.replicas ?? desired;
                        const updated = dep.status?.updatedReplicas ?? current;
                        const available = dep.status?.availableReplicas ?? 0;

                        workloads.push(
                            this.toWorkloadDto(
                                depName,
                                ns,
                                container.image || `${depName}:latest`,
                                meta,
                                { desired, current, updated, available }
                            )
                        );
                    }
                } catch (nsErr) {
                    console.warn(`[K8sDeploymentService] Nem sikerült lekérni a(z) '${ns}' névtér deploymentjeit:`, (nsErr as any)?.message || nsErr);
                }
            }

            if (workloads.length === 0) {
                return this.getFallbackOverview(namespace);
            }

            return {
                gitRepo: this.gitRepo,
                workloads
            };
        } catch (error) {
            console.error("[K8sDeploymentService] Hiba a deployments lekérésekor:", error);
            return this.getFallbackOverview(namespace);
        }
    };

    syncGitOps = async (): Promise<DeploymentsOverviewDto> => {
        this.gitRepo.lastSyncTime = new Date().toISOString();
        this.gitRepo.syncStatus = "Synced";

        for (const meta of this.workloadMeta.values()) {
            meta.syncStatus = "Synced";
        }

        return this.getDeploymentsOverview();
    };

    updateDeploymentStrategy = async (dto: UpdateDeploymentStrategyDto): Promise<WorkloadDeploymentDto> => {
        const key = `${dto.namespace}/${dto.deploymentName}`;
        const meta = this.getOrCreateMetadata(dto.namespace, dto.deploymentName);

        meta.strategy = dto.strategy;
        if (dto.canaryWeight !== undefined) {
            meta.canaryWeight = dto.canaryWeight;
        }
        if (dto.promoteBlueGreen) {
            meta.blueGreenActive = meta.blueGreenActive === "blue" ? "green" : "blue";
        }

        await this.patchDeployment(dto.namespace, dto.deploymentName, (dep) => {
            if (dep.metadata?.annotations) {
                dep.metadata.annotations["devops.portal/strategy"] = meta.strategy;
                dep.metadata.annotations["devops.portal/canary-weight"] = String(meta.canaryWeight);
                dep.metadata.annotations["devops.portal/blue-green-active"] = meta.blueGreenActive;
            }
        });

        const activeRev = meta.history.find(h => h.status === "active");
        const currentImage = activeRev?.imageTag || `${dto.deploymentName}:latest`;

        return this.toWorkloadDto(dto.deploymentName, dto.namespace, currentImage, meta);
    };

    rollbackDeployment = async (dto: RollbackDeploymentDto): Promise<WorkloadDeploymentDto> => {
        const key = `${dto.namespace}/${dto.deploymentName}`;
        const meta = this.workloadMeta.get(key);

        if (!meta) {
            throw new Error(`Nem található deployment metaadat a(z) '${dto.deploymentName}' workloadhoz.`);
        }

        const targetRev = meta.history.find(h => h.revision === dto.targetRevision);
        if (!targetRev) {
            throw new Error(`Nem található a(z) ${dto.targetRevision}. revízió az előzményekben.`);
        }

        meta.history.forEach(h => {
            h.status = h.revision === dto.targetRevision ? "active" : "superseded";
        });

        await this.patchDeployment(dto.namespace, dto.deploymentName, (dep) => {
            const container = dep.spec?.template?.spec?.containers?.[0];
            if (container) {
                container.image = targetRev.imageTag;
            }
            if (dep.spec?.template?.metadata?.annotations) {
                dep.spec.template.metadata.annotations["devops.portal/rollbackTo"] = String(dto.targetRevision);
            }
        });

        return this.toWorkloadDto(dto.deploymentName, dto.namespace, targetRev.imageTag, meta);
    };

    private getOrCreateMetadata(namespace: string, deploymentName: string, dep?: any): WorkloadMetadata {
        const key = `${namespace}/${deploymentName}`;
        let meta = this.workloadMeta.get(key);

        if (!meta) {
            meta = {
                strategy: (dep?.metadata?.annotations?.["devops.portal/strategy"] as DeploymentStrategy) || "RollingUpdate",
                canaryWeight: Number(dep?.metadata?.annotations?.["devops.portal/canary-weight"]) || 0,
                blueGreenActive: (dep?.metadata?.annotations?.["devops.portal/blue-green-active"] as "blue" | "green") || "blue",
                syncStatus: "Synced",
                healthStatus: "Healthy",
                history: [
                    {
                        revision: 1,
                        imageTag: dep?.spec?.template?.spec?.containers?.[0]?.image || `${deploymentName}:latest`,
                        deployedAt: new Date().toISOString(),
                        status: "active",
                        commitHash: "gitops-init",
                        author: "System",
                        strategy: "RollingUpdate"
                    }
                ]
            };
            this.workloadMeta.set(key, meta);
        }

        return meta;
    }

    private toWorkloadDto(
        name: string,
        namespace: string,
        currentImage: string,
        meta: WorkloadMetadata,
        replicas = { desired: 1, current: 1, updated: 1, available: 1 }
    ): WorkloadDeploymentDto {
        return {
            name,
            namespace,
            currentImage,
            strategy: meta.strategy,
            syncStatus: meta.syncStatus,
            healthStatus: replicas.available >= replicas.desired ? "Healthy" : "Progressing",
            replicas,
            canaryWeight: meta.strategy === "Canary" ? meta.canaryWeight : undefined,
            blueGreenActive: meta.strategy === "BlueGreen" ? meta.blueGreenActive : undefined,
            history: meta.history
        };
    }

    private async patchDeployment(
        namespace: string,
        deploymentName: string,
        mutate: (dep: any) => void
    ): Promise<void> {
        try {
            const dep = await this.client.appsApi.readNamespacedDeployment({
                name: deploymentName,
                namespace
            });

            if (dep.metadata && !dep.metadata.annotations) {
                dep.metadata.annotations = {};
            }
            if (dep.spec?.template?.metadata && !dep.spec.template.metadata.annotations) {
                dep.spec.template.metadata.annotations = {};
            }

            mutate(dep);

            if (dep.spec?.template?.metadata?.annotations) {
                dep.spec.template.metadata.annotations["kubectl.kubernetes.io/restartedAt"] = new Date().toISOString();
            }

            await this.client.appsApi.replaceNamespacedDeployment({
                name: deploymentName,
                namespace,
                body: dep
            });
        } catch (err) {
            console.warn(`[K8sDeploymentService] K8s API hiba a(z) '${deploymentName}' frissítésekor:`, (err as any)?.message || err);
        }
    }

    private getFallbackOverview(namespace?: string): DeploymentsOverviewDto {
        const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
        const workloads: WorkloadDeploymentDto[] = [];

        for (const [key, meta] of this.workloadMeta.entries()) {
            const [ns, name] = key.split("/");
            if (!ns || !name) continue;

            if (targetNamespaces.includes(ns)) {
                const activeRev = meta.history.find(h => h.status === "active") || meta.history[0];
                const currentImage = activeRev?.imageTag || `${name}:latest`;

                workloads.push(
                    this.toWorkloadDto(name, ns, currentImage, meta)
                );
            }
        }

        return {
            gitRepo: this.gitRepo,
            workloads
        };
    }
}