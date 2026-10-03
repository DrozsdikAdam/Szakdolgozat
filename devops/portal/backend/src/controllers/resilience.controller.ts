import type { Request, Response, NextFunction } from "express";
import { ResilienceService } from "../services/resilience.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type {
    KillPodRequestDto,
    KillPodResponseDto,
    LoadTestDetailDto,
    LoadTestResponseDto,
    NetworkTestRequestDto,
    NetworkTestResponseDto,
    ResilienceOverviewDto,
    StartLoadTestDto
} from "../dtos/resilience.dto.js";

export class ResilienceController {
    private resilienceService: ResilienceService;

    constructor() {
        this.resilienceService = new ResilienceService();
    }

    getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = await this.resilienceService.getResilienceOverview();
            const response: ApiResponse<ResilienceOverviewDto> = {
                success: true,
                data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    triggerPodKill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: KillPodRequestDto = req.body;
            const data = await this.resilienceService.triggerPodKill(dto);
            const response: ApiResponse<KillPodResponseDto> = {
                success: data.status !== 'FAILED',
                data,
                message: data.message,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    startLoadTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: StartLoadTestDto = req.body;
            const data = await this.resilienceService.startLoadTest(dto);
            const response: ApiResponse<LoadTestResponseDto> = {
                success: true,
                data,
                message: data.message,
                timestamp: new Date().toISOString()
            };
            res.status(202).json(response);
        } catch (error) {
            next(error);
        }
    };

    getLoadTestDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { jobName } = req.params;
            const data = await this.resilienceService.getLoadTestDetails(String(jobName));
            const response: ApiResponse<LoadTestDetailDto> = {
                success: true,
                data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    testNetworkProxy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: NetworkTestRequestDto = req.body;
            const data = await this.resilienceService.testNetworkProxy(dto);
            const response: ApiResponse<NetworkTestResponseDto> = {
                success: true,
                data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

}
