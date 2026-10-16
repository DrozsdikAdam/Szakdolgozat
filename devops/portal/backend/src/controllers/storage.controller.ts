import type { Request, Response, NextFunction } from "express";
import { StorageService } from "../services/storage.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";

export class StorageController {
    private storageService: StorageService;

    constructor() {
        this.storageService = new StorageService();
    }

    getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const overview = await this.storageService.getOverview();
            sendSuccess(res, overview);
        } catch (error) {
            next(error);
        }
    };

    saveConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.storageService.saveConfig(req.body);
            if (!result.success) {
                sendError(res, result.message, 400);
                return;
            }
            sendSuccess(res, undefined, result.message);
        } catch (error) {
            next(error);
        }
    };

    testConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.storageService.testConnection(req.body);
            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };
}
