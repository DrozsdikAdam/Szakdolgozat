import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import { sendSuccess } from "../utils/response.util.js";
import type { TelemetryTimeRange } from "../dtos/telemetry.dto.js";

export class TelemetryController {
    private k8sService: K8sService;

    constructor() {
        this.k8sService = new K8sService();
    }

    getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const timeRange = (typeof req.query.timeRange === "string" ? req.query.timeRange : "1h") as TelemetryTimeRange;
            const overview = await this.k8sService.getTelemetryOverview(timeRange);
            sendSuccess(res, overview);
        } catch (error) {
            next(error);
        }
    };

    getWorkloads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = typeof req.query.namespace === "string" ? req.query.namespace : undefined;
            const workloads = await this.k8sService.getTelemetryWorkloads(namespace);
            sendSuccess(res, workloads);
        } catch (error) {
            next(error);
        }
    };

    getDashboards = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dashboards = this.k8sService.getTelemetryDashboards();
            sendSuccess(res, dashboards);
        } catch (error) {
            next(error);
        }
    };
}
