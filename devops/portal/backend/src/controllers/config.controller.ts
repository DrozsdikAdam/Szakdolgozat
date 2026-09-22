import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import { AuditService } from "../services/audit.service.js";
import type { ApiResponse } from "../dtos/common.dto.js";
import type {
    ConfigMapDto,
    SecretDto,
    SecretRevealDto,
    SaveConfigDto,
    RestartWorkloadDto
} from "../dtos/config.dto.js";

export class ConfigController {
    private k8sService: K8sService;
    private auditService: AuditService;

    constructor() {
        this.k8sService = new K8sService();
        this.auditService = new AuditService();
    }

    getConfigMaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = typeof req.query.namespace === 'string' ? req.query.namespace : undefined;
            const configMaps = await this.k8sService.getConfigMaps(namespace);

            const response: ApiResponse<ConfigMapDto[]> = {
                success: true,
                data: configMaps,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    saveConfigMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as SaveConfigDto;
            if (!dto.name || !dto.namespace || !dto.data) {
                res.status(400).json({
                    success: false,
                    message: "A név, névtér és kulcs-érték adatok megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const saved = await this.k8sService.saveConfigMap(dto);

            await this.auditService.logAudit(
                'CONFIG_MAP_UPDATE',
                `ConfigMap mentve: ${dto.namespace}/${dto.name} (${Object.keys(dto.data).length} kulcs)`,
                'SUCCESS'
            );

            const response: ApiResponse<ConfigMapDto> = {
                success: true,
                data: saved,
                message: `ConfigMap '${dto.name}' sikeresen elmentve.`,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            await this.auditService.logAudit(
                'CONFIG_MAP_UPDATE',
                `ConfigMap mentési hiba: ${(error as any)?.message || error}`,
                'FAILED'
            );
            next(error);
        }
    };

    deleteConfigMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = String(req.params.namespace || '');
            const name = String(req.params.name || '');
            if (!namespace || !name) {
                res.status(400).json({
                    success: false,
                    message: "A névtér és név megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            await this.k8sService.deleteConfigMap(namespace, name);

            await this.auditService.logAudit(
                'CONFIG_MAP_DELETE',
                `ConfigMap törölve: ${namespace}/${name}`,
                'SUCCESS'
            );

            const response: ApiResponse<void> = {
                success: true,
                message: `ConfigMap '${name}' sikeresen törölve.`,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            await this.auditService.logAudit(
                'CONFIG_MAP_DELETE',
                `ConfigMap törlési hiba (${req.params.name}): ${(error as any)?.message || error}`,
                'FAILED'
            );
            next(error);
        }
    };

    getSecrets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = typeof req.query.namespace === 'string' ? req.query.namespace : undefined;
            const secrets = await this.k8sService.getSecrets(namespace);

            const response: ApiResponse<SecretDto[]> = {
                success: true,
                data: secrets,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    revealSecret = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = String(req.params.namespace || '');
            const name = String(req.params.name || '');
            if (!namespace || !name) {
                res.status(400).json({
                    success: false,
                    message: "A névtér és név megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const revealed = await this.k8sService.revealSecret(namespace, name);

            await this.auditService.logAudit(
                'SECRET_REVEAL',
                `Secret feloldva megtekintésre: ${namespace}/${name}`,
                'SUCCESS'
            );

            const response: ApiResponse<SecretRevealDto> = {
                success: true,
                data: revealed,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    saveSecret = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as SaveConfigDto;
            if (!dto.name || !dto.namespace || !dto.data) {
                res.status(400).json({
                    success: false,
                    message: "A név, névtér és kulcs-érték adatok megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const saved = await this.k8sService.saveSecret(dto);

            await this.auditService.logAudit(
                'SECRET_UPDATE',
                `Secret mentve: ${dto.namespace}/${dto.name} (${Object.keys(dto.data).length} kulcs)`,
                'SUCCESS'
            );

            const response: ApiResponse<SecretDto> = {
                success: true,
                data: saved,
                message: `Secret '${dto.name}' sikeresen elmentve.`,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            await this.auditService.logAudit(
                'SECRET_UPDATE',
                `Secret mentési hiba: ${(error as any)?.message || error}`,
                'FAILED'
            );
            next(error);
        }
    };

    deleteSecret = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = String(req.params.namespace || '');
            const name = String(req.params.name || '');
            if (!namespace || !name) {
                res.status(400).json({
                    success: false,
                    message: "A névtér és név megadása kötelező.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            await this.k8sService.deleteSecret(namespace, name);

            await this.auditService.logAudit(
                'SECRET_DELETE',
                `Secret törölve: ${namespace}/${name}`,
                'SUCCESS'
            );

            const response: ApiResponse<void> = {
                success: true,
                message: `Secret '${name}' sikeresen törölve.`,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            await this.auditService.logAudit(
                'SECRET_DELETE',
                `Secret törlési hiba (${req.params.name}): ${(error as any)?.message || error}`,
                'FAILED'
            );
            next(error);
        }
    };

    restartWorkload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = String(req.body.namespace || '');
            const workloadNames = Array.isArray(req.body.workloadNames) ? (req.body.workloadNames as string[]) : [];
            if (!namespace || workloadNames.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Névtér és legalább egy workload megadása kötelező az újraindításhoz.",
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const result = await this.k8sService.restartWorkload(namespace, workloadNames);

            await this.auditService.logAudit(
                'WORKLOAD_RESTART',
                `Workload(ok) újraindítása kezdeményezve (${namespace}): ${workloadNames.join(", ")}`,
                'SUCCESS'
            );

            const response: ApiResponse<RestartWorkloadDto> = {
                success: true,
                data: result,
                message: result.message || "Workload újraindítás sikeresen kezdeményezve.",
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            await this.auditService.logAudit(
                'WORKLOAD_RESTART',
                `Workload újraindítási hiba: ${(error as any)?.message || error}`,
                'FAILED'
            );
            next(error);
        }
    };
}
