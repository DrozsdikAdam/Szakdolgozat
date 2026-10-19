import type { Request, Response, NextFunction } from "express";
import { PipelineService } from "../services/pipeline.service.js";
import { AuditService } from "../services/audit.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { pipelineConfig } from "../config/pipeline.config.js";
import type {
    ManualApprovalRequest,
    RolloutActionRequest
} from "../types/pipeline.types.js";

export class PipelineController {
    private pipelineService: PipelineService;
    private auditService: AuditService;

    constructor() {
        this.pipelineService = new PipelineService();
        this.auditService = new AuditService();
    }

    getPipelineRuns = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const runs = await this.pipelineService.getPipelineRuns();
            sendSuccess(res, runs);
        } catch (error) {
            next(error);
        }
    };

    triggerPipeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const branch = typeof req.body?.branch === "string" ? req.body.branch.trim() : undefined;
            const result = await this.pipelineService.triggerPipeline(branch);

            await this.auditService.logAudit(
                "PIPELINE_TRIGGER",
                `Pipeline indítás kezdeményezve a(z) '${branch || "alapértelmezett"}' ágon. Eredmény: ${result.message}`,
                result.success ? "SUCCESS" : "FAILED"
            );

            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };

    approvePipeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const runId = String(req.params.id || req.body?.runId || "");
            const decision = req.body?.decision === "rejected" ? "rejected" : "approved";
            const approver = typeof req.body?.approver === "string" && req.body.approver.trim()
                ? req.body.approver.trim()
                : "DevOps Engineer";
            const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() : undefined;

            const approvalReq: ManualApprovalRequest = {
                runId,
                decision,
                approver,
                comment
            };

            const result = await this.pipelineService.approvePipeline(approvalReq);

            await this.auditService.logAudit(
                "PIPELINE_APPROVAL",
                `Pipeline #${runId} jóváhagyási döntés: ${decision} (${approver} által).`,
                result.success ? "SUCCESS" : "FAILED"
            );

            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };

    getGitOpsDrift = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const driftReport = await this.pipelineService.getGitOpsDrift();
            sendSuccess(res, driftReport);
        } catch (error) {
            next(error);
        }
    };

    executeRolloutAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const action = req.body?.action as RolloutActionRequest["action"] || "status";
            const rolloutName = typeof req.body?.rolloutName === "string" && req.body.rolloutName.trim()
                ? req.body.rolloutName.trim()
                : undefined;
            const namespace = typeof req.body?.namespace === "string" && req.body.namespace.trim()
                ? req.body.namespace.trim()
                : undefined;
            const full = Boolean(req.body?.full);

            const rolloutReq: RolloutActionRequest = {
                rolloutName,
                namespace,
                action,
                full
            };

            const result = await this.pipelineService.executeRolloutAction(rolloutReq);

            await this.auditService.logAudit(
                "ROLLOUT_ACTION",
                `Argo Rollout művelet (${action}) végrehajtva a(z) '${rolloutName || "alapértelmezett"}' erőforráson (${namespace || "alapértelmezett"} névtér). Eredmény: ${result.message}`,
                result.success ? "SUCCESS" : "FAILED"
            );

            if (!result.success) {
                sendError(res, result.message, 400);
                return;
            }

            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };

    getPipelineConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            sendSuccess(res, {
                defaultStrategy: pipelineConfig.defaultStrategy,
                defaultAppName: pipelineConfig.defaultAppName,
                appNamespace: pipelineConfig.appNamespace,
                stagingBranch: pipelineConfig.stagingBranch,
                productionBranch: pipelineConfig.productionBranch
            });
        } catch (error) {
            next(error);
        }
    };

    updatePipelineStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const rawStrategy = typeof req.body?.strategy === "string" ? req.body.strategy.trim().toLowerCase() : "";
            if (!rawStrategy) {
                sendError(res, "A 'strategy' paraméter megadása kötelező ('canary' vagy 'bluegreen').", 400);
                return;
            }

            const strategy = rawStrategy.includes("blue") ? "bluegreen" : "canary";

            await this.pipelineService.saveStrategyToEnv(strategy);

            await this.auditService.logAudit(
                "UPDATE_DEPLOYMENT_STRATEGY",
                `Telepítési stratégia átállítva: ${strategy}`,
                "SUCCESS"
            );

            sendSuccess(res, { strategy }, `Alapértelmezett stratégia sikeresen átállítva: ${strategy}`);
        } catch (error) {
            next(error);
        }
    };
}
