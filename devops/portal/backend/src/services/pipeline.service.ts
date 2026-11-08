import fs from "fs";
import { pipelineConfig } from "../config/pipeline.config.js";
import { K8sClientService } from "./k8s/k8s-client.service.js";
import { DEFAULT_PLATFORM_NAMESPACE } from "../constants/namespace.constants.js";
import { PipelineMapper } from "../mappers/pipeline.mapper.js";
import {
    createFallbackPipelineRuns,
    getRolloutName,
    getRolloutPatch
} from "../constants/pipeline.constants.js";
import type { PipelineJobResponseDto } from "../dtos/pipeline.dto.js";
import type {
    GitOpsDriftReport,
    ManualApprovalRequest,
    PipelineRun,
    PipelineRunRolloutInfo,
    PipelineStage,
    RolloutActionRequest
} from "../types/pipeline.types.js";

const PRE_PROD_STAGE_RULES: readonly { id: string; duration: number }[] = [
    { id: "backend-test", duration: 4 },
    { id: "frontend-test", duration: 4 },
    { id: "docker-build", duration: 6 },
    { id: "deploy-staging", duration: 4 }
];

export class PipelineService {
    private k8sClient: K8sClientService;
    private static cachedRuns: PipelineRun[] | null = null;

    constructor(k8sClient?: K8sClientService) {
        this.k8sClient = k8sClient || K8sClientService.getInstance();
    }

    private static advanceRunStages(run: PipelineRun & { approvedAt?: string }): void {
        if (run.status !== "in_progress") {
            return;
        }

        const now = Date.now();
        const createdTime = new Date(run.createdAt).getTime();
        const elapsed = Math.max(0, Math.floor((now - createdTime) / 1000));
        const prodStage = run.stages.find(s => s.id === "deploy-production");

        if (run.approvedAt) {
            PipelineService.advanceApprovedProductionRun(run, now, prodStage);
            return;
        }

        const cumulativePreProdDuration = PipelineService.updatePreProductionStages(run, elapsed);

        if (elapsed < cumulativePreProdDuration) {
            if (prodStage) {
                prodStage.status = "pending";
                prodStage.durationSeconds = 0;
            }
            run.status = "in_progress";
            return;
        }

        const isProdBranch = run.branch === "main" || run.branch === pipelineConfig.productionBranch;
        if (!isProdBranch) {
            if (prodStage) {
                prodStage.status = "skipped";
                prodStage.durationSeconds = 0;
            }
            run.status = "success";
            run.updatedAt = new Date().toISOString();
            return;
        }

        if (prodStage) {
            prodStage.status = "pending";
            prodStage.durationSeconds = 0;
        }
        run.status = "waiting_approval";
        run.updatedAt = new Date().toISOString();
    }

    private static advanceApprovedProductionRun(
        run: PipelineRun & { approvedAt?: string },
        now: number,
        prodStage?: PipelineStage
    ): void {
        PRE_PROD_STAGE_RULES.forEach(rule => {
            const s = run.stages.find(st => st.id === rule.id);
            if (s) {
                s.status = "success";
            }
        });

        const approvedElapsed = Math.max(0, Math.floor((now - new Date(run.approvedAt!).getTime()) / 1000));
        const PROD_TRANSITION_SECONDS = 4;

        if (approvedElapsed < PROD_TRANSITION_SECONDS) {
            if (prodStage) {
                prodStage.status = "running";
                prodStage.durationSeconds = Math.max(1, approvedElapsed);
            }
            run.status = "in_progress";
            return;
        }

        if (prodStage) {
            prodStage.status = "success";
            prodStage.durationSeconds = 18;
        }
        run.status = "success";
        run.updatedAt = new Date().toISOString();
    }

    private static updatePreProductionStages(run: PipelineRun, elapsed: number): number {
        let cumulative = 0;
        for (const rule of PRE_PROD_STAGE_RULES) {
            const stage = run.stages.find(s => s.id === rule.id);
            if (!stage) continue;

            if (elapsed < cumulative) {
                stage.status = "pending";
                stage.durationSeconds = 0;
            } else if (elapsed < cumulative + rule.duration) {
                stage.status = "running";
                stage.durationSeconds = Math.max(1, elapsed - cumulative);
            } else {
                stage.status = "success";
                stage.durationSeconds = rule.duration;
            }
            cumulative += rule.duration;
        }
        return cumulative;
    }

    private static getOrCreateFallbackRuns(): PipelineRun[] {
        if (!PipelineService.cachedRuns) {
            PipelineService.cachedRuns = createFallbackPipelineRuns(
                pipelineConfig.repoOwner,
                pipelineConfig.repoName,
                pipelineConfig.productionBranch,
                pipelineConfig.stagingBranch
            );
        }
        return PipelineService.cachedRuns;
    }

    private async githubRequest<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
        if (!pipelineConfig.githubToken) return null;

        const url = `https://api.github.com/repos/${pipelineConfig.repoOwner}/${pipelineConfig.repoName}${endpoint}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "PaaS-Portal-Backend",
                    "Authorization": `Bearer ${pipelineConfig.githubToken}`,
                    "Content-Type": "application/json",
                    ...options?.headers
                }
            });

            if (!response.ok && response.status !== 204) return null;
            if (response.status === 204) return {} as T;

            return (await response.json()) as T;
        } catch (fetchErr) {
            console.warn(`[PipelineService] GitHub API hálózati kérés hiba (${endpoint}):`, (fetchErr as Error)?.message || fetchErr);
            return null;
        }
    }

    getPipelineRuns = async (): Promise<PipelineRun[]> => {
        try {
            const data = await this.githubRequest<{ workflow_runs: any[] }>("/actions/runs?per_page=10");
            if (data?.workflow_runs && data.workflow_runs.length > 0) {
                return data.workflow_runs.map(run => PipelineMapper.toPipelineRun(run, pipelineConfig));
            }
        } catch (error) {
            console.warn("[PipelineService] GitHub API nem elérhető:", (error as Error)?.message);
        }

        const fallbackRuns = PipelineService.getOrCreateFallbackRuns();
        for (const run of fallbackRuns) {
            PipelineService.advanceRunStages(run as any);
        }

        try {
            const liveRollout = await this.fetchLiveRolloutSummary(pipelineConfig.appNamespace);
            if (liveRollout) {
                const prodRun = fallbackRuns.find(r => r.branch === pipelineConfig.productionBranch || r.branch === "main") || fallbackRuns[0];
                if (prodRun) {
                    prodRun.rollout = liveRollout;
                    const prodStage = prodRun.stages.find(s => s.id === "deploy-production");
                    if (prodStage) {
                        if (liveRollout.strategy === "Canary") {
                            prodStage.name = `Production Gate (Canary ${liveRollout.canaryWeight}%)`;
                            if (liveRollout.canaryWeight !== undefined && liveRollout.canaryWeight >= 100) {
                                prodStage.status = "success";
                                if (prodRun.status !== "waiting_approval") prodRun.status = "success";
                            } else {
                                prodStage.status = "running";
                                if (prodRun.status !== "waiting_approval") prodRun.status = "in_progress";
                            }
                        } else if (liveRollout.strategy === "BlueGreen") {
                            const colorName = liveRollout.blueGreenActive === "green" ? "Zöld aktív" : "Kék aktív";
                            prodStage.name = `Production Gate (${colorName})`;
                        }
                    }
                }
            }
        } catch (rolloutSyncErr) {
            console.warn("[PipelineService] Live rollout szinkron hiba a futtatásokhoz:", rolloutSyncErr);
        }

        return fallbackRuns;
    };

    fetchLiveRolloutSummary = async (namespace?: string): Promise<PipelineRunRolloutInfo | undefined> => {
        const targetNs = namespace || pipelineConfig.appNamespace;
        try {
            const customApi = this.k8sClient.customObjectsApi as any;
            const listRes = await customApi.listNamespacedCustomObject({
                group: "argoproj.io",
                version: "v1alpha1",
                namespace: targetNs,
                plural: "rollouts"
            });
            const items = listRes?.items || listRes?.body?.items || [];
            if (items.length === 0) return undefined;

            const ro = items[0];
            const roName = ro.metadata?.name || "";
            const roStrategy: "Canary" | "BlueGreen" | "RollingUpdate" =
                (ro.metadata?.annotations?.["devops.portal/strategy"] as any) ||
                (ro.spec?.strategy?.canary ? "Canary" : "BlueGreen");

            const canaryWeight =
                (ro.metadata?.annotations?.["devops.portal/canary-weight"] ? Number(ro.metadata.annotations["devops.portal/canary-weight"]) : undefined) ??
                ro.spec?.strategy?.canary?.steps?.[0]?.setWeight ??
                ro.status?.canary?.weights?.[0]?.weight ??
                20;

            const blueGreenActive = (ro.metadata?.annotations?.["devops.portal/blue-green-active"] as "blue" | "green") ||
                (ro.status?.blueGreen?.activeSelector ? "blue" : "green");

            const phase = ro.status?.phase || "Healthy";
            const isPaused = Boolean(ro.spec?.paused || (ro.status?.pauseConditions && ro.status.pauseConditions.length > 0));

            return {
                name: roName,
                namespace: targetNs,
                strategy: roStrategy,
                canaryWeight,
                blueGreenActive,
                phase,
                isPaused
            };
        } catch (fetchErr: unknown) {
            console.warn(`[PipelineService] Nem sikerült lekérni a live rollout állapotot a(z) '${targetNs}' névtérben:`, (fetchErr as Error)?.message || fetchErr);
            return undefined;
        }
    };

    public static recordRolloutRun(
        namespace: string,
        rolloutName: string,
        strategy: "Canary" | "BlueGreen" | "RollingUpdate",
        canaryWeight?: number,
        actionName?: string
    ): void {
        const fallbackRuns = PipelineService.getOrCreateFallbackRuns();
        const prodBranch = pipelineConfig.productionBranch || "main";
        const existing = fallbackRuns.find(r => r.rollout?.name === rolloutName || r.branch === prodBranch);
        const timestamp = new Date().toISOString();

        const rolloutInfo: PipelineRunRolloutInfo = {
            name: rolloutName,
            namespace,
            strategy,
            canaryWeight: canaryWeight ?? (strategy === "Canary" ? 20 : undefined),
            blueGreenActive: "blue",
            phase: (canaryWeight !== undefined && canaryWeight >= 100) ? "Healthy" : "Progressing",
            isPaused: false
        };

        if (existing) {
            existing.rollout = rolloutInfo;
            existing.updatedAt = timestamp;
            const prodStage = existing.stages.find(s => s.id === "deploy-production");
            if (prodStage) {
                if (strategy === "Canary") {
                    prodStage.name = `Production Gate (Canary ${rolloutInfo.canaryWeight}%)`;
                    prodStage.status = (rolloutInfo.canaryWeight ?? 0) >= 100 ? "success" : "running";
                } else if (strategy === "BlueGreen") {
                    prodStage.name = `Production Gate (Blue-Green)`;
                    prodStage.status = "running";
                }
            }
            if (strategy === "Canary" && (rolloutInfo.canaryWeight ?? 0) >= 100) {
                existing.status = "success";
            } else if (existing.status !== "waiting_approval") {
                existing.status = "in_progress";
            }
            return;
        }

        const nextRunNum = (fallbackRuns[0]?.runNumber || 42) + 1;
        const newRun: PipelineRun = {
            id: `run-${Date.now()}`,
            runNumber: nextRunNum,
            branch: prodBranch,
            commitHash: "c8e4a1b",
            commitMessage: actionName || `${strategy} Rollout Telepítés (${rolloutName})`,
            author: pipelineConfig.repoOwner || "Portal User",
            status: (canaryWeight ?? 0) >= 100 ? "success" : "in_progress",
            workflowUrl: `https://github.com/${pipelineConfig.repoOwner}/${pipelineConfig.repoName}/actions`,
            createdAt: timestamp,
            updatedAt: timestamp,
            rollout: rolloutInfo,
            stages: [
                { id: "backend-test", name: "Backend Tesztek", status: "success", durationSeconds: 45 },
                { id: "frontend-test", name: "Frontend Tesztek", status: "success", durationSeconds: 32 },
                { id: "docker-build", name: "Docker Build", status: "success", durationSeconds: 58 },
                { id: "deploy-staging", name: "Staging Telepites", status: "success", durationSeconds: 24 },
                {
                    id: "deploy-production",
                    name: strategy === "Canary" ? `Production Gate (Canary ${rolloutInfo.canaryWeight}%)` : `Production Gate (Blue-Green)`,
                    status: (rolloutInfo.canaryWeight ?? 0) >= 100 ? "success" : "running",
                    durationSeconds: 15
                }
            ]
        };
        fallbackRuns.unshift(newRun);
    };

    triggerPipeline = async (branch?: string): Promise<PipelineJobResponseDto> => {
        const targetBranch = branch || pipelineConfig.stagingBranch;
        const timestamp = new Date().toISOString();

        try {
            const result = await this.githubRequest("/actions/workflows/ci-cd.yml/dispatches", {
                method: "POST",
                body: JSON.stringify({ ref: targetBranch })
            });

            if (result !== null) {
                return {
                    success: true,
                    message: `CI/CD Pipeline sikeresen elinditva a(z) '${targetBranch}' agon a GitHub felhoben.`,
                    jobId: `dispatch-${Date.now()}`,
                    timestamp
                };
            }
        } catch (error) {
            console.warn("[PipelineService] GitHub dispatch hiba:", (error as Error)?.message);
        }

        const fallbackRuns = PipelineService.getOrCreateFallbackRuns();
        const nextRunNum = (fallbackRuns[0]?.runNumber || 42) + 1;
        const newRunId = `run-${Date.now()}`;
        const newRun: PipelineRun = {
            id: newRunId,
            runNumber: nextRunNum,
            branch: targetBranch,
            commitHash: "a7c2e1f",
            commitMessage: `Manuális pipeline indítás a(z) ${targetBranch} ágon`,
            author: pipelineConfig.repoOwner || "Portal User",
            status: "in_progress",
            workflowUrl: `https://github.com/${pipelineConfig.repoOwner}/${pipelineConfig.repoName}/actions`,
            createdAt: timestamp,
            updatedAt: timestamp,
            stages: [
                { id: "backend-test", name: "Backend Tesztek", status: "running", durationSeconds: 1 },
                { id: "frontend-test", name: "Frontend Tesztek", status: "pending", durationSeconds: 0 },
                { id: "docker-build", name: "Docker Build", status: "pending", durationSeconds: 0 },
                { id: "deploy-staging", name: "Staging Telepites", status: "pending", durationSeconds: 0 },
                { id: "deploy-production", name: "Production Gate", status: "pending", durationSeconds: 0 }
            ]
        };
        fallbackRuns.unshift(newRun);

        return {
            success: true,
            message: `Pipeline futtatás sikeresen elindítva a(z) '${targetBranch}' ágon.`,
            jobId: newRunId,
            timestamp
        };
    };

    approvePipeline = async (request: ManualApprovalRequest): Promise<PipelineJobResponseDto> => {
        const timestamp = new Date().toISOString();
        const decisionText = request.decision === "approved" ? "jóváhagyva" : "elutasítva";

        const fallbackRuns = PipelineService.getOrCreateFallbackRuns();
        const targetRun = fallbackRuns.find(r => r.id === request.runId || String(r.runNumber) === request.runId);
        if (targetRun) {
            if (request.decision === "approved") {
                (targetRun as any).approvedAt = timestamp;
                targetRun.status = "in_progress";
                targetRun.updatedAt = timestamp;
                const prodStage = targetRun.stages.find(s => s.id === "deploy-production");
                if (prodStage) {
                    prodStage.status = "running";
                    prodStage.durationSeconds = 1;
                }
            } else {
                targetRun.status = "failed";
                targetRun.updatedAt = timestamp;
                const prodStage = targetRun.stages.find(s => s.id === "deploy-production");
                if (prodStage) {
                    prodStage.status = "failed";
                    prodStage.durationSeconds = 0;
                }
            }
        }

        if (request.runId.startsWith("run-")) {
            return {
                success: true,
                message: `A(z) #${request.runId} pipeline futás sikeresen ${decisionText} (${request.approver} által).`,
                jobId: request.runId,
                timestamp
            };
        }

        try {
            const pendingList = await this.githubRequest<any[]>(`/actions/runs/${request.runId}/pending_deployments`);
            const envIds = (pendingList || []).map(p => p.environment?.id).filter(Boolean);

            if (envIds.length > 0) {
                await this.githubRequest(`/actions/runs/${request.runId}/pending_deployments`, {
                    method: "POST",
                    body: JSON.stringify({
                        environment_ids: envIds,
                        state: request.decision,
                        comment: request.comment || `Approved by ${request.approver} via MES PaaS Portal`
                    })
                });
            }
        } catch (error) {
            console.warn("[PipelineService] Approval API hiba:", (error as Error)?.message);
        }

        return {
            success: true,
            message: `A(z) #${request.runId} pipeline futás sikeresen ${decisionText} (${request.approver} által).`,
            jobId: request.runId,
            timestamp
        };
    };

    getGitOpsDrift = async (targetNamespace?: string): Promise<GitOpsDriftReport> => {
        try {
            const customApi = this.k8sClient.customObjectsApi as any;
            const destNs = targetNamespace || pipelineConfig.appNamespace;
            let appBody: any = null;

            const namespaces = Array.from(new Set([DEFAULT_PLATFORM_NAMESPACE, "platform-infra", "argocd"]));
            for (const ns of namespaces) {
                try {
                    const listRes = await customApi.listNamespacedCustomObject({
                        group: "argoproj.io",
                        version: "v1alpha1",
                        namespace: ns,
                        plural: "applications"
                    });

                    const items = listRes?.items || listRes?.body?.items || [];
                    if (items.length > 0) {
                        appBody = items.find((a: any) => a.spec?.destination?.namespace === destNs) || items[0];
                        break;
                    }
                } catch (nsErr: any) {
                    const isNotFound = nsErr?.response?.statusCode === 404 || nsErr?.statusCode === 404;
                    if (!isNotFound) {
                        console.warn(`[PipelineService] ArgoCD alkalmazások lekérdezése sikertelen a(z) '${ns}' névtérből:`, nsErr?.message || nsErr);
                    }
                }
            }

            if (appBody?.status) {
                return PipelineMapper.toDriftReport(appBody, destNs, pipelineConfig.stagingBranch);
            }
        } catch (error) {
            console.warn("[PipelineService] ArgoCD allapot lekerdezesi hiba:", (error as Error)?.message);
        }

        return {
            isSynced: false,
            syncStatus: "Unknown",
            targetRevision: pipelineConfig.stagingBranch,
            outOfSyncResources: []
        };
    };

    private resolveLiveRolloutName = async (namespace: string, requestedName?: string): Promise<string> => {
        const customApi = this.k8sClient.customObjectsApi as any;

        if (requestedName) {
            try {
                const res = await customApi.getNamespacedCustomObject({
                    group: "argoproj.io",
                    version: "v1alpha1",
                    namespace,
                    plural: "rollouts",
                    name: requestedName
                });
                if (res) return requestedName;
            } catch (resolveErr: unknown) {
                console.warn(`[PipelineService] A(z) '${requestedName}' Rollout nem található (${namespace} névtér):`, (resolveErr as Error)?.message || resolveErr);
            }
        }

        try {
            const listRes = await customApi.listNamespacedCustomObject({
                group: "argoproj.io",
                version: "v1alpha1",
                namespace,
                plural: "rollouts"
            });
            const items = listRes?.items || listRes?.body?.items || [];
            if (items.length > 0) {
                const baseName = (requestedName || pipelineConfig.defaultAppName).replace(/-(bluegreen|canary)$/, "");
                const matched = items.find((item: any) => {
                    const name = item.metadata?.name || "";
                    return name === requestedName || name.startsWith(baseName);
                });

                if (matched?.metadata?.name) {
                    return matched.metadata.name;
                }

                return items[0].metadata?.name;
            }
        } catch (listErr: any) {
            console.warn(`[PipelineService] Nem sikerült listázni a Rolloutokat a(z) '${namespace}' névtérben:`, listErr?.message || listErr);
        }

        return requestedName || getRolloutName(pipelineConfig.defaultAppName, pipelineConfig.defaultStrategy);
    };

    executeRolloutAction = async (request: RolloutActionRequest): Promise<PipelineJobResponseDto> => {
        const namespace = request.namespace || pipelineConfig.appNamespace;
        const rolloutName = await this.resolveLiveRolloutName(namespace, request.rolloutName);
        const timestamp = new Date().toISOString();
        const patchDef = getRolloutPatch(request.action);

        const k8sPayload = {
            group: "argoproj.io",
            version: "v1alpha1",
            namespace,
            plural: "rollouts",
            name: rolloutName,
            body: patchDef.body
        };

        try {
            const customApi = this.k8sClient.customObjectsApi as any;
            await this.dispatchRolloutPatch(customApi, k8sPayload, patchDef.subresource);

            if (request.action === "promote" && request.full) {
                try {
                    const { K8sDeploymentService } = await import("./k8s/k8s-deployment.service.js");
                    const deploymentService = new K8sDeploymentService(this.k8sClient);
                    await deploymentService.updateDeploymentStrategy({
                        deploymentName: rolloutName,
                        namespace,
                        strategy: "Canary",
                        canaryWeight: 100
                    });
                } catch (promoteErr) {
                    console.warn("[PipelineService] Canary 100% súly frissítési hiba:", promoteErr);
                }
            }

            const cached = PipelineService.getOrCreateFallbackRuns().find(r => r.rollout?.name === rolloutName || r.branch === (pipelineConfig.productionBranch || "main"));
            if (cached?.rollout) {
                if (request.action === "pause") cached.rollout.isPaused = true;
                if (request.action === "resume") cached.rollout.isPaused = false;
                if (request.action === "abort") {
                    cached.status = "failed";
                    const s = cached.stages.find(st => st.id === "deploy-production");
                    if (s) s.status = "failed";
                }
                if (request.action === "promote" && request.full) {
                    cached.rollout.canaryWeight = 100;
                    cached.status = "success";
                    const s = cached.stages.find(st => st.id === "deploy-production");
                    if (s) {
                        s.status = "success";
                        s.name = "Production Gate (100% Canary - Élesben)";
                    }
                }
            }

            return {
                success: true,
                message: `Rollout művelet (${request.action}) sikeresen végrehajtva a(z) '${rolloutName}' erőforráson (${namespace} névtér).`,
                jobId: `rollout-${request.action}-${Date.now()}`,
                timestamp
            };
        } catch (error) {
            const errorMsg =
                (error as any)?.response?.body?.message ||
                (error as any)?.response?.body?.error ||
                (error as Error)?.message || "Ismeretlen Kubernetes hiba";

            console.warn(`[PipelineService] K8s Rollout hiba (${request.action}):`, errorMsg);

            return {
                success: false,
                message: `Rollout művelet (${request.action}) sikertelen a(z) '${rolloutName}' erőforráson (${namespace} névtér): ${errorMsg}`,
                jobId: `rollout-failed-${Date.now()}`,
                timestamp
            };
        }
    };

    private dispatchRolloutPatch = async (customApi: any, payload: object, subresource?: string): Promise<void> => {
        if (subresource === "status" && typeof customApi.patchNamespacedCustomObjectStatus === "function") {
            try {
                await customApi.patchNamespacedCustomObjectStatus(payload);
                return;
            } catch (statusErr: any) {
                console.warn("[PipelineService] Status patch sikertelen, fallback spec patch-re:", statusErr?.message || statusErr);
            }
        }

        try {
            await customApi.patchNamespacedCustomObject(payload);
        } catch (patchErr: any) {
            console.warn("[PipelineService] Spec patch hiba:", patchErr?.message || patchErr);
            throw patchErr;
        }
    };

    saveStrategyToEnv = async (strategy: "canary" | "bluegreen"): Promise<void> => {
        try {
            pipelineConfig.defaultStrategy = strategy;

            if (!fs.existsSync(pipelineConfig.envPath)) {
                return;
            }

            const envVal = strategy === "bluegreen" ? "blue-green" : "canary";
            const rawContent = fs.readFileSync(pipelineConfig.envPath, "utf-8");

            const updatedContent = rawContent.includes("DEFAULT_STRATEGY=")
                ? rawContent.replace(/DEFAULT_STRATEGY=[^\r\n]+/, `DEFAULT_STRATEGY=${envVal}`)
                : `${rawContent.trimEnd()}\nDEFAULT_STRATEGY=${envVal}\n`;

            fs.writeFileSync(pipelineConfig.envPath, updatedContent, "utf-8");
        } catch (err) {
            console.warn("[PipelineService] Nem sikerült frissíteni a pipeline.env fájlt:", err);
        }
    };
}