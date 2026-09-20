import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type {
    TelemetryOverViewDto,
    TelemetryTimeRange,
    WorkloadMetricDto,
    GrafanaDashboardDto
} from "../dtos/telemetry.dto.js";

export class TelemetryController {
    private k8sService: K8sService;

    constructor() {
        this.k8sService = new K8sService();
    }

    getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const timeRange = (typeof req.query.timeRange === "string" ? req.query.timeRange : "1h") as TelemetryTimeRange;
            const overview = await this.k8sService.getTelemetryOverview(timeRange);

            const response: ApiResponse<TelemetryOverViewDto> = {
                success: true,
                data: overview,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getWorkloads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = typeof req.query.namespace === "string" ? req.query.namespace : undefined;
            const workloads = await this.k8sService.getTelemetryWorkloads(namespace);

            const response: ApiResponse<WorkloadMetricDto[]> = {
                success: true,
                data: workloads,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getDashboards = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dashboards = this.k8sService.getTelemetryDashboards();

            const response: ApiResponse<GrafanaDashboardDto[]> = {
                success: true,
                data: dashboards,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
}
