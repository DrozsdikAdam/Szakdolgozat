import type { Request, Response, NextFunction } from "express";
import { PipelineService } from "../services/pipeline.service.js";
import { AuditService } from "../services/audit.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type { PipelineJobResponseDto } from "../dtos/pipeline.dto.js";
import type {
    GitOpsDriftReport,
    ManualApprovalRequest,
    PipelineRun,
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

            const response: ApiResponse<PipelineRun[]> = {
                success: true,
                data: runs,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
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

            const response: ApiResponse<PipelineJobResponseDto> = {
                success: result.success,
                data: result,
                message: result.message,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
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

            const response: ApiResponse<PipelineJobResponseDto> = {
                success: result.success,
                data: result,
                message: result.message,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getGitOpsDrift = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const driftReport = await this.pipelineService.getGitOpsDrift();

            const response: ApiResponse<GitOpsDriftReport> = {
                success: true,
                data: driftReport,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    executeRolloutAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const action = req.body?.action as RolloutActionRequest["action"] || "status";
            const rolloutName = typeof req.body?.rolloutName === "string" ? req.body.rolloutName.trim() : "mes-backend-canary";
            const namespace = typeof req.body?.namespace === "string" ? req.body.namespace.trim() : "app-mes";
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
                `Argo Rollout művelet (${action}) végrehajtva a(z) '${rolloutName}' erőforráson (${namespace} névtér).`,
                result.success ? "SUCCESS" : "FAILED"
            );

            const response: ApiResponse<PipelineJobResponseDto> = {
                success: result.success,
                data: result,
                message: result.message,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
}
