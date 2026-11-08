import { K8sClientService } from "./k8s-client.service.js";
import {
    DEFAULT_GITOPS_REPO,
    DEFAULT_WORKLOAD_METADATA,
    createDefaultWorkloadMetadata
} from "../../constants/k8s-deployment.constants.js";
import { DEFAULT_PLATFORM_NAMESPACE } from "../../constants/namespace.constants.js";
import type { WorkloadMetadata } from "../../types/k8s.types.js";
import type {
    GitRepoConfig,
    DeploymentStrategy,
    DeploymentRevision
} from "../../types/deployment.dto.js";
import type { DeploymentsOverviewDto, RollbackDeploymentDto, UpdateDeploymentStrategyDto, WorkloadDeploymentDto } from "../../dtos/deployment.dto.js";
import { PipelineService } from "../pipeline.service.js";

export class K8sDeploymentService {
    private client: K8sClientService;
    private gitRepo: GitRepoConfig;
    private static workloadMeta: Map<string, WorkloadMetadata> = new Map(Object.entries(DEFAULT_WORKLOAD_METADATA));

    constructor(client?: K8sClientService) {
        this.client = client || K8sClientService.getInstance();
        this.gitRepo = { ...DEFAULT_GITOPS_REPO };
        if (K8sDeploymentService.workloadMeta.size === 0) {
            K8sDeploymentService.workloadMeta = new Map(Object.entries(DEFAULT_WORKLOAD_METADATA));
        }
    }

    getDeploymentsOverview = async (namespace?: string): Promise<DeploymentsOverviewDto> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const workloads: WorkloadDeploymentDto[] = [];
            const dynamicGitRepo = await this.fetchDynamicGitRepo(namespace);

            for (const ns of targetNamespaces) {
                try {
                    const deployList = await this.client.appsApi.listNamespacedDeployment({ namespace: ns });

                    for (const dep of deployList.items || []) {
                        const depName = dep.metadata?.name || "";
                        const container = dep.spec?.template?.spec?.containers?.[0];
                        if (!container) continue;

                        const meta = this.getOrCreateMetadata(ns, depName, dep);
                        const dynamicHistory = await this.fetchDynamicHistory(ns, depName, meta.strategy);
                        if (dynamicHistory.length > 0) {
                            meta.history = dynamicHistory;
                        }

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

                    try {
                        const rolloutsRes = await (this.client.customObjectsApi as any).listNamespacedCustomObject({
                            group: "argoproj.io",
                            version: "v1alpha1",
                            namespace: ns,
                            plural: "rollouts"
                        });
                        const rolloutsList = rolloutsRes?.items || rolloutsRes?.body?.items || [];
                        for (const ro of rolloutsList) {
                            const roName = ro.metadata?.name || "";
                            const container = ro.spec?.template?.spec?.containers?.[0];
                            if (!container) continue;

                            const roStrategy: DeploymentStrategy =
                                (ro.metadata?.annotations?.["devops.portal/strategy"] as DeploymentStrategy) ||
                                (ro.spec?.strategy?.canary ? "Canary" : "BlueGreen");
                            const metaKey = `${ns}/${roName}`;
                            const fallbackKey = `${ns}/${roName.replace(/-(bluegreen|canary)$/, '')}`;
                            let meta: WorkloadMetadata = K8sDeploymentService.workloadMeta.get(metaKey) ||
                                K8sDeploymentService.workloadMeta.get(fallbackKey) || {
                                strategy: roStrategy,
                                canaryWeight: 20,
                                blueGreenActive: "blue",
                                syncStatus: "Synced",
                                healthStatus: (ro.status?.phase === "Healthy" || (ro.status?.availableReplicas ?? 0) > 0) ? "Healthy" : "Progressing",
                                history: []
                            };

                            meta.strategy = roStrategy;

                            const liveWeight =
                                (ro.metadata?.annotations?.["devops.portal/canary-weight"] ? Number(ro.metadata.annotations["devops.portal/canary-weight"]) : undefined) ??
                                ro.spec?.strategy?.canary?.steps?.[0]?.setWeight ??
                                ro.status?.canary?.weights?.[0]?.weight ??
                                meta.canaryWeight ??
                                20;
                            meta.canaryWeight = liveWeight;

                            if (ro.status?.blueGreen?.activeSelector) {
                                meta.blueGreenActive = "blue";
                            } else if (ro.metadata?.annotations?.["devops.portal/blue-green-active"]) {
                                meta.blueGreenActive = ro.metadata.annotations["devops.portal/blue-green-active"] as "blue" | "green";
                            }

                            const dynamicHistory = await this.fetchDynamicHistory(ns, roName, roStrategy);
                            if (dynamicHistory.length > 0) {
                                meta.history = dynamicHistory;
                            }
                            K8sDeploymentService.workloadMeta.set(metaKey, meta);
                            K8sDeploymentService.workloadMeta.set(fallbackKey, meta);

                            const desired = ro.spec?.replicas ?? 1;
                            const current = ro.status?.replicas ?? desired;
                            const updated = ro.status?.updatedReplicas ?? current;
                            const available = ro.status?.availableReplicas ?? 0;

                            workloads.push(
                                this.toWorkloadDto(
                                    roName,
                                    ns,
                                    container.image || `${roName}:latest`,
                                    meta,
                                    { desired, current, updated, available }
                                )
                            );
                        }
                    } catch (roErr: any) {
                        const isNotFound = roErr?.response?.statusCode === 404 || roErr?.statusCode === 404;
                        if (!isNotFound) {
                            console.warn(`[K8sDeploymentService] Nem sikerült lekérni a Rolloutokat a(z) '${ns}' névtérből:`, roErr?.message || roErr);
                        }
                    }
                } catch (nsErr) {
                    console.warn(`[K8sDeploymentService] Nem sikerült lekérni a(z) '${ns}' névtér deploymentjeit:`, (nsErr as any)?.message || nsErr);
                }
            }

            return {
                gitRepo: dynamicGitRepo,
                workloads
            };
        } catch (error) {
            console.error("[K8sDeploymentService] Hiba a deployments lekérésekor:", error);
            return {
                gitRepo: await this.fetchDynamicGitRepo(namespace),
                workloads: []
            };
        }
    };

    private fetchDynamicGitRepo = async (targetNamespace?: string): Promise<GitRepoConfig> => {
        try {
            let app: any = null;
            const argocdNamespaces = [DEFAULT_PLATFORM_NAMESPACE, "platform-infra", "argocd"];
            const uniqueNs = Array.from(new Set(argocdNamespaces));

            for (const ns of uniqueNs) {
                try {
                    const listRes = await (this.client.customObjectsApi as any).listNamespacedCustomObject({
                        group: "argoproj.io",
                        version: "v1alpha1",
                        namespace: ns,
                        plural: "applications"
                    });

                    const items = listRes?.items || listRes?.body?.items || [];
                    if (items.length > 0) {
                        if (targetNamespace && targetNamespace !== "all") {
                            app = items.find((item: any) => item.spec?.destination?.namespace === targetNamespace) || items[0];
                        } else {
                            app = items[0];
                        }
                        break;
                    }
                } catch (argocdErr: any) {
                    const isNotFound = argocdErr?.response?.statusCode === 404 || argocdErr?.statusCode === 404;
                    if (!isNotFound) {
                        console.warn(`[K8sDeploymentService] Hiba az ArgoCD alkalmazások lekérésekor a(z) '${ns}' névtérből:`, argocdErr?.message || argocdErr);
                    }
                }
            }

            if (app?.spec) {
                let repoUrl = app.spec?.source?.repoURL || process.env.GIT_REPO_URL || DEFAULT_GITOPS_REPO.repoUrl;
                if (repoUrl.includes("${")) {
                    const m = repoUrl.match(/:-(.+)\}$/);
                    repoUrl = m ? m[1] : (process.env.GIT_REPO_URL || DEFAULT_GITOPS_REPO.repoUrl);
                }

                let branch = app.spec?.source?.targetRevision || process.env.PRODUCTION_BRANCH || "develop";
                if (branch.includes("${")) {
                    const m = branch.match(/:-(.+)\}$/);
                    branch = m ? m[1] : (process.env.PRODUCTION_BRANCH || "develop");
                }

                const path = app.spec?.source?.path || "k8s/overlays/staging";
                const rawSyncStatus = app.status?.sync?.status || "Synced";
                const syncStatus = rawSyncStatus === "Synced" ? "Synced" : (rawSyncStatus === "OutOfSync" ? "OutOfSync" : "Synced");
                const autoSync = Boolean(app.spec?.syncPolicy?.automated);
                const selfHeal = Boolean(app.spec?.syncPolicy?.automated?.selfHeal);
                const lastSyncTime = app.status?.reconciledAt || new Date().toISOString();

                let commitHash = app.status?.sync?.revision || "";
                if (commitHash.includes("${") || !commitHash || commitHash === branch) {
                    commitHash = "HEAD";
                } else if (commitHash.length > 7) {
                    commitHash = commitHash.substring(0, 7);
                }

                return {
                    repoUrl,
                    branch,
                    path,
                    syncStatus,
                    autoSync,
                    selfHeal,
                    lastSyncTime,
                    lastCommit: {
                        hash: commitHash,
                        message: "K8s GitOps szinkronizált deklaratív állapot",
                        author: "ArgoCD / GitOps",
                        timestamp: lastSyncTime
                    }
                };
            }
        } catch (err) {
            console.warn("[K8sDeploymentService] ArgoCD Application hiba, környezeti változókból építkezünk:", (err as any)?.message || err);
        }

        return {
            ...DEFAULT_GITOPS_REPO,
            repoUrl: process.env.GIT_REPO_URL || DEFAULT_GITOPS_REPO.repoUrl,
            branch: process.env.PRODUCTION_BRANCH || DEFAULT_GITOPS_REPO.branch,
            lastSyncTime: new Date().toISOString()
        };
    };

    private fetchDynamicHistory = async (
        namespace: string,
        workloadName: string,
        currentStrategy?: DeploymentStrategy
    ): Promise<DeploymentRevision[]> => {
        try {
            const rsRes = await this.client.appsApi.listNamespacedReplicaSet({ namespace });
            const allRs = rsRes?.items || [];

            const cleanWorkloadBase = workloadName.replace(/-(bluegreen|canary)$/, "");
            const matchingRs = allRs.filter(rs => {
                const name = rs.metadata?.name || "";
                const owner = rs.metadata?.ownerReferences?.[0]?.name;
                if (owner === workloadName || owner === cleanWorkloadBase) return true;
                return name.startsWith(`${workloadName}-`) || name.startsWith(`${cleanWorkloadBase}-`);
            });

            if (matchingRs.length === 0) return [];

            matchingRs.sort((a, b) => {
                const timeA = new Date(a.metadata?.creationTimestamp || 0).getTime();
                const timeB = new Date(b.metadata?.creationTimestamp || 0).getTime();
                return timeB - timeA;
            });

            return matchingRs.map((rs, index) => {
                const rawRev = rs.metadata?.annotations?.["deployment.kubernetes.io/revision"];
                const revisionNum = rawRev ? parseInt(rawRev, 10) : (matchingRs.length - index);
                const container = rs.spec?.template?.spec?.containers?.[0];
                const imageTag = container?.image || `${workloadName}:latest`;
                const replicas = rs.status?.replicas ?? 0;
                const availableReplicas = rs.status?.availableReplicas ?? 0;
                const deployedAt = rs.metadata?.creationTimestamp
                    ? new Date(rs.metadata.creationTimestamp).toISOString()
                    : new Date().toISOString();

                const podHash = rs.metadata?.labels?.["pod-template-hash"] ||
                    rs.metadata?.labels?.["rollouts-pod-template-hash"] ||
                    rs.metadata?.name?.split("-").pop() ||
                    `rev${revisionNum}`;

                const isActive = replicas > 0 || availableReplicas > 0;

                const resolvedStrategy: DeploymentStrategy = currentStrategy || (
                    workloadName.toLowerCase().includes("canary")
                        ? "Canary"
                        : (workloadName.toLowerCase().includes("bluegreen") ? "BlueGreen" : "RollingUpdate")
                );

                return {
                    revision: revisionNum,
                    imageTag,
                    deployedAt,
                    status: isActive ? "active" : "superseded",
                    commitHash: podHash.length > 7 ? podHash.substring(0, 7) : podHash,
                    author: "ArgoCD / K8s",
                    strategy: resolvedStrategy
                };
            });
        } catch (err) {
            console.warn(`[K8sDeploymentService] Nem sikerült dinamikusan kigyűjteni a ReplicaSet-eket (${workloadName}):`, (err as any)?.message || err);
            return [];
        }
    };

    syncGitOps = async (): Promise<DeploymentsOverviewDto> => {
        const argocdNamespaces = [DEFAULT_PLATFORM_NAMESPACE, "platform-infra", "argocd"];
        const uniqueNs = Array.from(new Set(argocdNamespaces));
        let syncedCount = 0;
        const syncErrors: string[] = [];

        for (const ns of uniqueNs) {
            try {
                const listRes = await (this.client.customObjectsApi as any).listNamespacedCustomObject({
                    group: "argoproj.io",
                    version: "v1alpha1",
                    namespace: ns,
                    plural: "applications"
                });

                const items = listRes?.items || listRes?.body?.items || [];
                for (const app of items) {
                    const appName = app.metadata?.name;
                    if (!appName) continue;
                    try {
                        const patchBody = app.metadata?.annotations
                            ? [
                                {
                                    op: "add",
                                    path: "/metadata/annotations/argocd.argoproj.io~1refresh",
                                    value: "hard"
                                }
                            ]
                            : [
                                {
                                    op: "add",
                                    path: "/metadata/annotations",
                                    value: { "argocd.argoproj.io/refresh": "hard" }
                                }
                            ];

                        await (this.client.customObjectsApi as any).patchNamespacedCustomObject({
                            group: "argoproj.io",
                            version: "v1alpha1",
                            namespace: ns,
                            plural: "applications",
                            name: appName,
                            body: patchBody
                        });
                        syncedCount++;
                        console.info(`[K8sDeploymentService] ArgoCD hard refresh sikeresen elküldve: ${ns}/${appName}`);
                    } catch (patchErr: any) {
                        const msg = `Nem sikerült frissíteni a(z) '${appName}' alkalmazást (${ns}): ${patchErr?.message || patchErr}`;
                        console.warn(`[K8sDeploymentService] ${msg}`);
                        syncErrors.push(msg);
                    }
                }
            } catch (listErr: any) {
                const isNotFound = listErr?.response?.statusCode === 404 || listErr?.statusCode === 404;
                if (!isNotFound) {
                    console.warn(`[K8sDeploymentService] Nem sikerült listázni az ArgoCD alkalmazásokat a(z) '${ns}' névtérben:`, listErr?.message || listErr);
                }
            }
        }

        if (syncedCount === 0 && syncErrors.length > 0) {
            console.error(`[K8sDeploymentService] GitOps szinkronizáció sikertelen. Hibák:`, syncErrors.join("; "));
            throw new Error(`GitOps szinkronizáció sikertelen: ${syncErrors.join("; ")}`);
        }

        for (const meta of K8sDeploymentService.workloadMeta.values()) {
            meta.syncStatus = syncedCount > 0 ? "Synced" : "OutOfSync";
        }

        return this.getDeploymentsOverview();
    };

    updateDeploymentStrategy = async (dto: UpdateDeploymentStrategyDto): Promise<WorkloadDeploymentDto> => {
        const key = `${dto.namespace}/${dto.deploymentName}`;
        const fallbackKey = `${dto.namespace}/${dto.deploymentName.replace(/-(bluegreen|canary)$/, '')}`;
        let meta = K8sDeploymentService.workloadMeta.get(key) || K8sDeploymentService.workloadMeta.get(fallbackKey);
        if (!meta) {
            meta = this.getOrCreateMetadata(dto.namespace, dto.deploymentName);
        }

        meta.strategy = dto.strategy;
        if (dto.canaryWeight !== undefined) {
            meta.canaryWeight = dto.canaryWeight;
        }
        if (dto.promoteBlueGreen) {
            meta.blueGreenActive = meta.blueGreenActive === "blue" ? "green" : "blue";
        }

        K8sDeploymentService.workloadMeta.set(key, meta);
        K8sDeploymentService.workloadMeta.set(fallbackKey, meta);

        PipelineService.recordRolloutRun(
            dto.namespace,
            dto.deploymentName,
            dto.strategy,
            dto.canaryWeight,
            `${dto.strategy} kiadás (${dto.canaryWeight !== undefined ? `${dto.canaryWeight}% súly` : 'átkapcsolás'})`
        );

        await this.syncStrategyEnv(dto.strategy);

        await this.patchWorkload(dto.namespace, dto.deploymentName, (workload, kind) => {
            if (workload.metadata?.annotations) {
                workload.metadata.annotations["devops.portal/strategy"] = meta.strategy;
                workload.metadata.annotations["devops.portal/canary-weight"] = String(meta.canaryWeight);
                workload.metadata.annotations["devops.portal/blue-green-active"] = meta.blueGreenActive;
            }

            if (kind === "Rollout") {
                if (!workload.spec) workload.spec = {};
                if (!workload.spec.strategy) workload.spec.strategy = {};
                if (dto.strategy === "Canary") {
                    delete workload.spec.strategy.blueGreen;
                    if (!workload.spec.strategy.canary) workload.spec.strategy.canary = {};
                    workload.spec.strategy.canary.steps = [
                        { setWeight: meta.canaryWeight }
                    ];
                } else if (dto.strategy === "BlueGreen") {
                    delete workload.spec.strategy.canary;
                    if (!workload.spec.strategy.blueGreen) workload.spec.strategy.blueGreen = {};
                    const baseAppName = dto.deploymentName.replace(/-(bluegreen|canary)$/, "");
                    workload.spec.strategy.blueGreen.activeService = workload.spec.strategy.blueGreen.activeService || baseAppName;
                    workload.spec.strategy.blueGreen.previewService = workload.spec.strategy.blueGreen.previewService || `${baseAppName}-preview`;
                    if (dto.promoteBlueGreen) {
                        workload.spec.strategy.blueGreen.autoPromotionEnabled = true;
                    }
                } else if (dto.strategy === "RollingUpdate") {
                    delete workload.spec.strategy.blueGreen;
                    workload.spec.strategy.canary = {
                        steps: [{ setWeight: 100 }]
                    };
                }
            } else if (kind === "Deployment") {
                if (!workload.spec) workload.spec = {};
                workload.spec.strategy = {
                    type: "RollingUpdate",
                    rollingUpdate: { maxSurge: "25%", maxUnavailable: "25%" }
                };
            }
        });

        const activeRev = meta.history.find((h: DeploymentRevision) => h.status === "active");
        const currentImage = activeRev?.imageTag || `${dto.deploymentName}:latest`;

        return this.toWorkloadDto(dto.deploymentName, dto.namespace, currentImage, meta);
    };

    rollbackDeployment = async (dto: RollbackDeploymentDto): Promise<WorkloadDeploymentDto> => {
        const key = `${dto.namespace}/${dto.deploymentName}`;
        const fallbackKey = `${dto.namespace}/${dto.deploymentName.replace(/-(bluegreen|canary)$/, '')}`;
        let meta = K8sDeploymentService.workloadMeta.get(key) || K8sDeploymentService.workloadMeta.get(fallbackKey);

        if (!meta || meta.history.length === 0) {
            const dynamicHistory = await this.fetchDynamicHistory(dto.namespace, dto.deploymentName);
            if (dynamicHistory.length > 0) {
                meta = createDefaultWorkloadMetadata(dto.deploymentName, dynamicHistory[0]?.imageTag, dynamicHistory[0]?.strategy);
                meta.history = dynamicHistory;
                K8sDeploymentService.workloadMeta.set(key, meta);
                K8sDeploymentService.workloadMeta.set(fallbackKey, meta);
            }
        }

        if (!meta) {
            throw new Error(`Nem található deployment metaadat a(z) '${dto.deploymentName}' workloadhoz.`);
        }

        const targetRev = meta.history.find((h: DeploymentRevision) => h.revision === dto.targetRevision);
        if (!targetRev) {
            throw new Error(`Nem található a(z) ${dto.targetRevision}. revízió az előzményekben.`);
        }

        meta.history.forEach((h: DeploymentRevision) => {
            h.status = h.revision === dto.targetRevision ? "active" : "superseded";
        });

        await this.patchWorkload(dto.namespace, dto.deploymentName, (workload) => {
            const container = workload.spec?.template?.spec?.containers?.[0];
            if (container) {
                container.image = targetRev.imageTag;
            }
            if (!workload.spec) workload.spec = {};
            if (!workload.spec.template) workload.spec.template = {};
            if (!workload.spec.template.metadata) workload.spec.template.metadata = {};
            if (!workload.spec.template.metadata.annotations) workload.spec.template.metadata.annotations = {};
            workload.spec.template.metadata.annotations["devops.portal/rollbackTo"] = String(dto.targetRevision);
        });

        return this.toWorkloadDto(dto.deploymentName, dto.namespace, targetRev.imageTag, meta);
    };

    private getOrCreateMetadata(namespace: string, deploymentName: string, dep?: any): WorkloadMetadata {
        const key = `${namespace}/${deploymentName}`;
        const fallbackKey = `${namespace}/${deploymentName.replace(/-(bluegreen|canary)$/, '')}`;
        let meta = K8sDeploymentService.workloadMeta.get(key) || K8sDeploymentService.workloadMeta.get(fallbackKey);

        if (!meta) {
            const strategy = (dep?.metadata?.annotations?.["devops.portal/strategy"] as DeploymentStrategy) || "RollingUpdate";
            const imageTag = dep?.spec?.template?.spec?.containers?.[0]?.image || `${deploymentName}:latest`;
            meta = createDefaultWorkloadMetadata(deploymentName, imageTag, strategy);

            if (dep?.metadata?.annotations?.["devops.portal/canary-weight"]) {
                meta.canaryWeight = Number(dep.metadata.annotations["devops.portal/canary-weight"]);
            }
            if (dep?.metadata?.annotations?.["devops.portal/blue-green-active"]) {
                meta.blueGreenActive = dep.metadata.annotations["devops.portal/blue-green-active"] as "blue" | "green";
            }

            K8sDeploymentService.workloadMeta.set(key, meta);
            K8sDeploymentService.workloadMeta.set(fallbackKey, meta);
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

    private async patchWorkload(
        namespace: string,
        workloadName: string,
        mutate: (workload: any, kind: "Deployment" | "Rollout") => void
    ): Promise<void> {
        let deploymentError: any = null;

        try {
            const dep = await this.client.appsApi.readNamespacedDeployment({
                name: workloadName,
                namespace
            });

            const targetDep = dep as any;
            if (targetDep) {
                if (!targetDep.metadata) targetDep.metadata = {};
                if (!targetDep.metadata.annotations) targetDep.metadata.annotations = {};
                if (!targetDep.spec) targetDep.spec = {};
                if (!targetDep.spec.template) targetDep.spec.template = {};
                if (!targetDep.spec.template.metadata) targetDep.spec.template.metadata = {};
                if (!targetDep.spec.template.metadata.annotations) targetDep.spec.template.metadata.annotations = {};

                mutate(targetDep, "Deployment");

                targetDep.spec.template.metadata.annotations["kubectl.kubernetes.io/restartedAt"] = new Date().toISOString();

                await this.client.appsApi.replaceNamespacedDeployment({
                    name: workloadName,
                    namespace,
                    body: targetDep
                });
                return;
            }
        } catch (depErr: any) {
            const statusCode = depErr?.response?.statusCode || depErr?.statusCode;
            if (statusCode !== 404) {
                deploymentError = depErr;
                console.warn(`[K8sDeploymentService] Hiba a(z) '${workloadName}' Deployment olvasásakor (${namespace}):`, depErr?.message || depErr);
            }
        }

        let rolloutError: any = null;
        try {
            const roRes = await (this.client.customObjectsApi as any).getNamespacedCustomObject({
                group: "argoproj.io",
                version: "v1alpha1",
                namespace,
                plural: "rollouts",
                name: workloadName
            });

            const ro = roRes?.body || roRes;
            if (ro) {
                if (!ro.metadata) ro.metadata = {};
                if (!ro.metadata.annotations) ro.metadata.annotations = {};
                if (!ro.spec) ro.spec = {};
                if (!ro.spec.template) ro.spec.template = {};
                if (!ro.spec.template.metadata) ro.spec.template.metadata = {};
                if (!ro.spec.template.metadata.annotations) ro.spec.template.metadata.annotations = {};

                mutate(ro, "Rollout");

                ro.spec.template.metadata.annotations["kubectl.kubernetes.io/restartedAt"] = new Date().toISOString();

                await (this.client.customObjectsApi as any).replaceNamespacedCustomObject({
                    group: "argoproj.io",
                    version: "v1alpha1",
                    namespace,
                    plural: "rollouts",
                    name: workloadName,
                    body: ro
                });
                return;
            }
        } catch (roErr: any) {
            rolloutError = roErr;
            const statusCode = roErr?.response?.statusCode || roErr?.statusCode;
            if (statusCode !== 404) {
                console.warn(`[K8sDeploymentService] Hiba a(z) '${workloadName}' Rollout módosításakor (${namespace}):`, roErr?.message || roErr);
            }
        }

        const details = [
            deploymentError ? `Deployment hiba: ${deploymentError.message || deploymentError}` : null,
            rolloutError ? `Rollout hiba: ${rolloutError.message || rolloutError}` : null
        ].filter(Boolean).join(" | ");

        throw new Error(
            `A(z) '${workloadName}' workload nem módosítható sem Deployment, sem Rollout erőforrásként a(z) '${namespace}' névtérben${details ? ` (${details})` : ""}.`
        );
    }

    private getFallbackOverview(namespace?: string): DeploymentsOverviewDto {
        const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
        const workloads: WorkloadDeploymentDto[] = [];

        for (const [key, meta] of K8sDeploymentService.workloadMeta.entries()) {
            const [ns, name] = key.split("/");
            if (!ns || !name) continue;

            if (targetNamespaces.includes(ns)) {
                const activeRev = meta.history.find((h: DeploymentRevision) => h.status === "active") || meta.history[0];
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

    private async syncStrategyEnv(strategy: DeploymentStrategy): Promise<void> {
        if (strategy !== "Canary" && strategy !== "BlueGreen") return;

        const targetStrategy = strategy === "Canary" ? "canary" : "bluegreen";
        const pipelineService = new PipelineService(this.client);
        await pipelineService.saveStrategyToEnv(targetStrategy);
    }
}