import type { Request, Response, NextFunction } from "express";
import { ConfigService } from "../services/config.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type { PlatformStatusResponse } from "../dtos/status.dto.js";
import type { FeatureFlag } from "../models/FeatureFlag.js";

export class PlatformController {

    private configService: ConfigService;

    constructor() {
        this.configService = new ConfigService();
    }

    getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = await this.configService.getPlatformStatus();

            const response: ApiResponse<PlatformStatusResponse> = {
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    setup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.configService.saveSetupWizard(req.body);

            const response: ApiResponse<void> = {
                success: true,
                message: 'ok',
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    toggleFeature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const flag = await this.configService.toggleFeature(req.body);

            const response: ApiResponse<FeatureFlag> = {
                success: true,
                data: flag,
                message: "Feature flag updated",
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

}