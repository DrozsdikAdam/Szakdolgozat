import type { Request, Response, NextFunction } from "express";
import { SecurityService } from "../services/security.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type { SecurityOverviewDto, LoginRequestDto, LoginResponseDto } from "../dtos/security.dto.js";
import type { VulnerabilityItem, TlsCertificateStatus, SecretComplianceItem, SeverityType } from "../types/security.types.js";

export class SecurityController {
    private securityService: SecurityService;

    constructor() {
        this.securityService = new SecurityService();
    }

    getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = await this.securityService.getSecurityOverview();
            const response: ApiResponse<SecurityOverviewDto> = {
                success: true,
                data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getVulnerabilities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const severity = typeof req.query.severity === "string" ? (req.query.severity.toUpperCase() as SeverityType) : undefined;
            const component = typeof req.query.component === "string" ? req.query.component : undefined;

            const items = await this.securityService.getVulnerabilities(severity, component);
            const response: ApiResponse<VulnerabilityItem[]> = {
                success: true,
                data: items,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getTlsCertificates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const certs = await this.securityService.getTlsCertificates();
            const response: ApiResponse<TlsCertificateStatus[]> = {
                success: true,
                data: certs,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getSecretCompliance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const secrets = await this.securityService.getSecretCompliance();
            const response: ApiResponse<SecretComplianceItem[]> = {
                success: true,
                data: secrets,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body: LoginRequestDto = req.body || {};
            const result = await this.securityService.login(body);

            const response: ApiResponse<LoginResponseDto> = {
                success: result.success,
                data: result,
                message: result.message,
                timestamp: new Date().toISOString()
            };

            const statusCode = result.success ? 200 : 401;
            res.status(statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };

    rotateAdminPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
            const result = await this.securityService.rotateAdminPassword(newPassword);

            const response: ApiResponse<{ message: string; rotatedAt: string }> = {
                success: result.success,
                data: {
                    message: result.message,
                    rotatedAt: result.rotatedAt
                },
                message: result.message,
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
}
