import type { Request, Response, NextFunction } from "express";
import { DatabaseService } from "../services/database.service.js";
import { DatabaseMigrationService } from "../services/database-migration.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";

export class DatabaseController {
    private databaseService: DatabaseService;
    private migrationService: DatabaseMigrationService;

    constructor() {
        this.databaseService = new DatabaseService();
        this.migrationService = new DatabaseMigrationService();
    }

    getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const overview = await this.databaseService.getOverview();
            sendSuccess(res, overview);
        } catch (error) {
            next(error);
        }
    };

    testConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.databaseService.testConnection(req.body);
            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };

    scaleDatabase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.databaseService.scaleDatabase(req.body);
            sendSuccess(res, { replicas: result.replicas }, result.message);
        } catch (error) {
            next(error);
        }
    };

    saveConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.databaseService.saveConfig(req.body);
            sendSuccess(res, undefined, result.message);
        } catch (error) {
            next(error);
        }
    };

    startMigration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const job = await this.migrationService.startMigration(req.body);
            sendSuccess(res, job, "Adatbázis migrációs folyamat elindítva", 202);
        } catch (error) {
            next(error);
        }
    };

    getMigrationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const jobId = String(req.params.jobId || "");
            const status = this.migrationService.getMigrationStatus(jobId);

            if (!status) {
                sendError(res, `Migrációs feladat nem található: ${jobId}`, 404);
                return;
            }

            sendSuccess(res, status);
        } catch (error) {
            next(error);
        }
    };

    scheduleCutover = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.migrationService.scheduleCutover(req.body);
            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };

    getCutoverStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = this.migrationService.getCutoverStatus();
            sendSuccess(res, status);
        } catch (error) {
            next(error);
        }
    };

    cancelCutover = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.migrationService.cancelCutover();
            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };
}
