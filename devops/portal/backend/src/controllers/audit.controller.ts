import type { Request, Response, NextFunction } from "express";
import { AuditService } from "../services/audit.service.js";
import { sendSuccess } from "../utils/response.util.js";

export class AuditController {
    private auditService: AuditService;

    constructor() {
        this.auditService = new AuditService();
    }

    getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = Number(req.query.limit) || 50;
            const logs = await this.auditService.getAuditLogs(limit);
            sendSuccess(res, logs);
        } catch (error) {
            next(error);
        }
    };
}
