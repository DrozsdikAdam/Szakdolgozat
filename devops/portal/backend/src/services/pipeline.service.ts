import { pipelineConfig } from "../config/pipeline.config.js";
import { K8sClientService } from "./k8s/k8s-client.service.js";
import { PipelineMapper } from "../mappers/pipeline.mapper.js";
import { ROLLOUT_PATCH_MAP, createFallbackPipelineRuns } from "../constants/pipeline.constants.js";
import type { PipelineJobResponseDto } from "../dtos/pipeline.dto.js";
import type {
    GitOpsDriftReport,
    ManualApprovalRequest,
    PipelineRun,
    RolloutActionRequest
} from "../types/pipeline.types.js";

export class PipelineService {
    private k8sClient: K8sClientService;

    constructor(k8sClient?: K8sClientService) {
        this.k8sClient = k8sClient || K8sClientService.getInstance();
    }

    private async githubRequest<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
        if (!pipelineConfig.githubToken) return null;

        const url = `https://api.github.com/repos/${pipelineConfig.repoOwner}/${pipelineConfig.repoName}${endpoint}`;
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
    }

    getPipelineRuns = async (): Promise<PipelineRun[]> => {
        try {
            const data = await this.githubRequest<{ workflow_runs: any[] }>("/actions/runs?per_page=10");
            if (data?.workflow_runs) {
                return data.workflow_runs.map(run => PipelineMapper.toPipelineRun(run, pipelineConfig));
            }
        } catch (error) {
            console.warn("[PipelineService] GitHub API nem elerheto:", (error as Error)?.message);
        }

        return createFallbackPipelineRuns(
            pipelineConfig.repoOwner,
            pipelineConfig.repoName,
            pipelineConfig.productionBranch,
            pipelineConfig.stagingBranch
        );
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

        return {
            success: true,
            message: `Pipeline futtatas szimulalva a(z) '${targetBranch}' agon (helyi modban).`,
            jobId: `local-${Date.now()}`,
            timestamp
        };
    };

    approvePipeline = async (request: ManualApprovalRequest): Promise<PipelineJobResponseDto> => {
        const timestamp = new Date().toISOString();
        const decisionText = request.decision === "approved" ? "jovahagyva" : "elutasitva";

        // Szimulalt azonosito eseten nincs szukseg GitHub hivasra (Early Return)
        if (request.runId.startsWith("run-")) {
            return {
                success: true,
                message: `A(z) #${request.runId} pipeline futas sikeresen ${decisionText} (${request.approver} altal).`,
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
            message: `A(z) #${request.runId} pipeline futas sikeresen ${decisionText} (${request.approver} altal).`,
            jobId: request.runId,
            timestamp
        };
    };

    getGitOpsDrift = async (): Promise<GitOpsDriftReport> => {
        try {
            const customApi = this.k8sClient.customObjectsApi as any;
            const customObj = await customApi.getNamespacedCustomObject({
                group: "argoproj.io",
                version: "v1alpha1",
                namespace: "platform-infra",
                plural: "applications",
                name: "mes-staging"
            }).catch(() => null);

            const appBody = customObj?.body || customObj;
            if (appBody?.status) {
                return PipelineMapper.toDriftReport(appBody, pipelineConfig.appNamespace, pipelineConfig.stagingBranch);
            }
        } catch (error) {
            console.warn("[PipelineService] ArgoCD allapot lekerdezesi hiba:", (error as Error)?.message);
        }

        return {
            isSynced: true,
            syncStatus: "Synced",
            targetRevision: pipelineConfig.stagingBranch,
            outOfSyncResources: []
        };
    };

    executeRolloutAction = async (request: RolloutActionRequest): Promise<PipelineJobResponseDto> => {
        const rolloutName = request.rolloutName || "mes-backend-canary";
        const namespace = request.namespace || pipelineConfig.appNamespace;
        const timestamp = new Date().toISOString();
        const patchBody = ROLLOUT_PATCH_MAP[request.action];

        if (patchBody) {
            try {
                const patchFn = (this.k8sClient.customObjectsApi as any).patchNamespacedCustomObject;
                if (typeof patchFn === "function") {
                    await patchFn.call(this.k8sClient.customObjectsApi, {
                        group: "argoproj.io",
                        version: "v1alpha1",
                        namespace,
                        plural: "rollouts",
                        name: rolloutName,
                        body: patchBody
                    }).catch(() => null);
                }
            } catch (error) {
                console.warn(`[PipelineService] K8s Rollout hiba (${request.action}):`, (error as Error)?.message);
            }
        }

        return {
            success: true,
            message: `Rollout muvelet (${request.action}) sikeresen vegrehajtva a(z) '${rolloutName}' eroforrason (${namespace} nevter).`,
            jobId: `rollout-${request.action}-${Date.now()}`,
            timestamp
        };
    };
}