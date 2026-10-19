import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import { AuditService } from "../services/audit.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import type { UpdateProbeDto } from "../dtos/healthcheck.dto.js";

import { DEFAULT_APP_NAMESPACE } from '../constants/namespace.constants.js';

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
            sendSuccess(res, healthData);
        } catch (error) {
            next(error);
        }
    };

    updateProbe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as UpdateProbeDto;
            if (!dto.namespace || !dto.deploymentName || !dto.probeKind || !dto.probe) {
                sendError(res, "A névtér, deployment név, szonda fajta és szonda adatok megadása kötelező.", 400);
                return;
            }

            const updated = await this.k8sService.updateWorkloadProbe(dto);

            await this.auditService.logAudit(
                'UPDATE_HEALTHCHECK_PROBES',
                `Szonda frissítve (${dto.probeKind}): ${dto.namespace}/${dto.deploymentName} (Engedélyezve: ${dto.probe.enabled})`,
                'SUCCESS'
            );

            sendSuccess(
                res,
                updated,
                `A(z) ${dto.probeKind} szonda sikeresen frissítve a '${dto.deploymentName}' deploymenten.`
            );
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
            const namespace = String(req.body.namespace || DEFAULT_APP_NAMESPACE);
            const deploymentName = String(req.body.deploymentName || '');
            const path = typeof req.body.path === 'string' ? req.body.path : '/actuator/health';
            const port = req.body.port ?? 8080;

            if (!deploymentName) {
                sendError(res, "A deployment név megadása kötelező a teszteléshez.", 400);
                return;
            }

            const result = await this.k8sService.testProbeEndpoint(namespace, deploymentName, path, port);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    };
}
