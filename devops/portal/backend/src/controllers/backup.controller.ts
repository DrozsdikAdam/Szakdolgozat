import type { Request, Response, NextFunction } from "express";
import { BackupService } from "../services/backup.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type { BackupHistoryResponseDto, JobTriggerResponseDto } from "../dtos/backup.dto.js";

export class BackupController {

    private backupService: BackupService;

    constructor() {
        this.backupService = new BackupService();
    }

    getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const history = await this.backupService.getBackupHistory();

            const response: ApiResponse<BackupHistoryResponseDto> = {
                success: true,
                data: history,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    triggerBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.backupService.triggerBackup();

            const response: ApiResponse<JobTriggerResponseDto> = {
                success: true,
                data: result,
                message: "Backup job triggered successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(202).json(response);
        } catch (error) {
            next(error);
        }
    };

    triggerRestore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const targetBackup = req.body?.targetBackup || "latest";
            const result = await this.backupService.triggerRestore(targetBackup);

            const response: ApiResponse<JobTriggerResponseDto> = {
                success: true,
                data: result,
                message: `Restore job triggered for ${targetBackup}`,
                timestamp: new Date().toISOString(),
            };

            res.status(202).json(response);
        } catch (error) {
            next(error);
        }
    };

}
