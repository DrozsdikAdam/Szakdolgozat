import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import { AuditService } from "../services/audit.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type {
    WorkloadHealthDto,
    UpdateProbeDto,
    ProbeTestResultDto
} from "../dtos/healthcheck.dto.js";

export class HealthcheckController {
    private k8sService: K8sService;
    private auditService: AuditService;

    constructor() {
        this.k8sService = new K8sService();
        this.auditService = new AuditService();
    }

    getHealthchecks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = typeof req.query.namespace === 'string' ? req.query.namespace : undefined;
            const healthData = await this.k8sService.getWorkloadHealth(namespace);

            const response: ApiResponse<WorkloadHealthDto[]> = {
                success: true,
                data: healthData,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    updateProbe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as UpdateProbeDto;
            if (!dto.namespace || !dto.deploymentName || !dto.probeKind || !dto.probe) {
                res.status(400).json({
                    success: false,
                    message: "A névtér, deployment név, szonda fajta és szonda adatok megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const updated = await this.k8sService.updateWorkloadProbe(dto);

            await this.auditService.logAudit(
                'UPDATE_HEALTHCHECK_PROBES',
                `Szonda frissítve (${dto.probeKind}): ${dto.namespace}/${dto.deploymentName} (Engedélyezve: ${dto.probe.enabled})`,
                'SUCCESS'
            );

            const response: ApiResponse<WorkloadHealthDto> = {
                success: true,
                data: updated,
                message: `A(z) ${dto.probeKind} szonda sikeresen frissítve a '${dto.deploymentName}' deploymenten.`,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            await this.auditService.logAudit(
                'UPDATE_HEALTHCHECK_PROBES',
                `Szonda frissítési hiba: ${(error as any)?.message || error}`,
                'FAILED'
            );
            next(error);
        }
    };

    testProbe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = String(req.body.namespace || 'app-mes');
            const deploymentName = String(req.body.deploymentName || '');
            const path = typeof req.body.path === 'string' ? req.body.path : '/actuator/health';
            const port = req.body.port ?? 8080;

            if (!deploymentName) {
                res.status(400).json({
                    success: false,
                    message: "A deployment név megadása kötelező a teszteléshez.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const result = await this.k8sService.testProbeEndpoint(namespace, deploymentName, path, port);

            const response: ApiResponse<ProbeTestResultDto> = {
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
}
