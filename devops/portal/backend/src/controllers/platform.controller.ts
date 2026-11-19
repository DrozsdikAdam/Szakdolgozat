import type { Request, Response, NextFunction } from "express";
import { ConfigService } from "../services/config.service.js";
import { sendSuccess } from "../utils/response.util.js";

export class PlatformController {
    private configService: ConfigService;

    constructor() {
        this.configService = new ConfigService();
    }

    getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = await this.configService.getPlatformStatus();
            sendSuccess(res, status);
        } catch (error) {
            next(error);
        }
    };

    setup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.configService.saveSetupWizard(req.body);
            sendSuccess(res, undefined, 'ok');
        } catch (error) {
            next(error);
        }
    };

    toggleFeature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const flag = await this.configService.toggleFeature(req.body);
            sendSuccess(res, flag, "Feature flag updated");
        } catch (error) {
            next(error);
        }
    };
}