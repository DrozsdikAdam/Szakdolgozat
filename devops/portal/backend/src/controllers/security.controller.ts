import type { Request, Response, NextFunction } from "express";
import { SecurityService } from "../services/security.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import type { LoginRequestDto } from "../dtos/security.dto.js";
import type { SeverityType } from "../types/security.types.js";

export class SecurityController {
    private securityService: SecurityService;

    constructor() {
        this.securityService = new SecurityService();
    }

    getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = await this.securityService.getSecurityOverview();
            sendSuccess(res, data);
        } catch (error) {
            next(error);
        }
    };

    getVulnerabilities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const severity = typeof req.query.severity === "string" ? (req.query.severity.toUpperCase() as SeverityType) : undefined;
            const component = typeof req.query.component === "string" ? req.query.component : undefined;
            const items = await this.securityService.getVulnerabilities(severity, component);
            sendSuccess(res, items);
        } catch (error) {
            next(error);
        }
    };

    getTlsCertificates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const certs = await this.securityService.getTlsCertificates();
            sendSuccess(res, certs);
        } catch (error) {
            next(error);
        }
    };

    getSecretCompliance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const secrets = await this.securityService.getSecretCompliance();
            sendSuccess(res, secrets);
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body: LoginRequestDto = req.body || {};
            const result = await this.securityService.login(body);

            if (!result.success) {
                sendError(res, result.message, 401);
                return;
            }

            sendSuccess(res, result, result.message);
        } catch (error) {
            next(error);
        }
    };

    rotateAdminPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
            const result = await this.securityService.rotateAdminPassword(newPassword);

            if (!result.success) {
                sendError(res, result.message, 400);
                return;
            }

            sendSuccess(res, { message: result.message, rotatedAt: result.rotatedAt }, result.message);
        } catch (error) {
            next(error);
        }
    };
}
