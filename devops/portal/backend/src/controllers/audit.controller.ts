import type { Request, Response, NextFunction } from "express";
import { AuditService } from "../services/audit.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type { AuditResponseDto } from "../dtos/audit.dto.js";

export class AuditController {

    private auditService: AuditService;

    constructor() {
        this.auditService = new AuditService();
    }

    getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = Number(req.query.limit) || 50;
            const logs = await this.auditService.getAuditLogs(limit);

            const response: ApiResponse<AuditResponseDto[]> = {
                success: true,
                data: logs,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

}
