import type { Request, Response, NextFunction } from "express";
import { BackupService } from "../services/backup.service.js";
import { sendSuccess } from "../utils/response.util.js";

export class BackupController {
    private backupService: BackupService;

    constructor() {
        this.backupService = new BackupService();
    }

    getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const history = await this.backupService.getBackupHistory();
            sendSuccess(res, history);
        } catch (error) {
            next(error);
        }
    };

    getTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const target = await this.backupService.getBackupTarget();
            sendSuccess(res, target);
        } catch (error) {
            next(error);
        }
    };

    saveTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.backupService.saveBackupTarget(req.body);
            sendSuccess(res, undefined, result.message);
        } catch (error) {
            next(error);
        }
    };

    testTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.backupService.testBackupTarget(req.body);
            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };

    triggerBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.backupService.triggerBackup();
            sendSuccess(res, result, "Backup job triggered successfully", 202);
        } catch (error) {
            next(error);
        }
    };

    triggerRestore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const targetBackup = req.body?.targetBackup || "latest";
            const result = await this.backupService.triggerRestore(targetBackup);
            sendSuccess(res, result, `Restore job triggered for ${targetBackup}`, 202);
        } catch (error) {
            next(error);
        }
    };
}
