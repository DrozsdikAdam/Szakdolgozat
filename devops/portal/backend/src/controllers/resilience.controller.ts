import type { Request, Response, NextFunction } from "express";
import { ResilienceService } from "../services/resilience.service.js";
import { sendSuccess } from "../utils/response.util.js";
import type {
    KillPodRequestDto,
    NetworkTestRequestDto,
    StartLoadTestDto
} from "../dtos/resilience.dto.js";

export class ResilienceController {
    private resilienceService: ResilienceService;

    constructor() {
        this.resilienceService = new ResilienceService();
    }

    getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = await this.resilienceService.getResilienceOverview();
            sendSuccess(res, data);
        } catch (error) {
            next(error);
        }
    };

    triggerPodKill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: KillPodRequestDto = req.body;
            const data = await this.resilienceService.triggerPodKill(dto);
            sendSuccess(res, data, data.message);
        } catch (error) {
            next(error);
        }
    };

    startLoadTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: StartLoadTestDto = req.body;
            const data = await this.resilienceService.startLoadTest(dto);
            sendSuccess(res, data, data.message, 202);
        } catch (error) {
            next(error);
        }
    };

    getLoadTestDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { jobName } = req.params;
            const data = await this.resilienceService.getLoadTestDetails(String(jobName));
            sendSuccess(res, data);
        } catch (error) {
            next(error);
        }
    };

    testNetworkProxy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: NetworkTestRequestDto = req.body;
            const data = await this.resilienceService.testNetworkProxy(dto);
            sendSuccess(res, data);
        } catch (error) {
            next(error);
        }
    };
}
