import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import { AuditService } from "../services/audit.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type {
    DeploymentsOverviewDto,
    WorkloadDeploymentDto,
    UpdateDeploymentStrategyDto,
    RollbackDeploymentDto
} from "../dtos/deployment.dto.js";

export class DeploymentController {
    private k8sService: K8sService;
    private auditService: AuditService;

    constructor() {
        this.k8sService = new K8sService();
        this.auditService = new AuditService();
    }

    getDeployments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = typeof req.query.namespace === 'string' ? req.query.namespace : undefined;
            const overview = await this.k8sService.getDeploymentsOverview(namespace);

            const response: ApiResponse<DeploymentsOverviewDto> = {
                success: true,
                data: overview,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    syncGitOps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const updatedOverview = await this.k8sService.syncGitOps();

            await this.auditService.logAudit(
                'GITOPS_MANUAL_SYNC',
                `GitOps kézi szinkronizáció sikeresen lefutott a(z) '${updatedOverview.gitRepo.branch}' ágon (commit: ${updatedOverview.gitRepo.lastCommit.hash}).`,
                'SUCCESS'
            );

            const response: ApiResponse<DeploymentsOverviewDto> = {
                success: true,
                data: updatedOverview,
                message: "A GitOps repository szinkronizáció sikeresen befejeződött.",
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    updateStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as UpdateDeploymentStrategyDto;

            if (!dto.namespace || !dto.deploymentName || !dto.strategy) {
                res.status(400).json({
                    success: false,
                    message: "A névtér, deployment név és stratégia megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const updatedWorkload = await this.k8sService.updateDeploymentStrategy(dto);

            const detailMsg = dto.strategy === 'Canary'
                ? `Canary súly: ${dto.canaryWeight ?? 0}%`
                : dto.strategy === 'BlueGreen'
                    ? `Blue/Green aktív szín: ${updatedWorkload.blueGreenActive}`
                    : 'Gördülő frissítés';

            await this.auditService.logAudit(
                'UPDATE_DEPLOYMENT_STRATEGY',
                `Telepítési stratégia módosítva: ${dto.namespace}/${dto.deploymentName} (${dto.strategy}, ${detailMsg})`,
                'SUCCESS'
            );

            const response: ApiResponse<WorkloadDeploymentDto> = {
                success: true,
                data: updatedWorkload,
                message: `A(z) '${dto.deploymentName}' telepítési stratégiája sikeresen módosítva: ${dto.strategy}.`,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    rollback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as RollbackDeploymentDto;

            if (!dto.namespace || !dto.deploymentName || typeof dto.targetRevision !== 'number') {
                res.status(400).json({
                    success: false,
                    message: "A névtér, deployment név és cél revíziószám megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const rolledBack = await this.k8sService.rollbackDeployment(dto);

            await this.auditService.logAudit(
                'ROLLBACK_DEPLOYMENT',
                `Rollback végrehajtva: ${dto.namespace}/${dto.deploymentName} -> #${dto.targetRevision} revízió (${rolledBack.currentImage})`,
                'SUCCESS'
            );

            const response: ApiResponse<WorkloadDeploymentDto> = {
                success: true,
                data: rolledBack,
                message: `A(z) '${dto.deploymentName}' workload sikeresen visszaállítva a #${dto.targetRevision}. revízióra (${rolledBack.currentImage}).`,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
}
