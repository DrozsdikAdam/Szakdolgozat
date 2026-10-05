import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import { AuditService } from "../services/audit.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import type {
    SaveConfigDto
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
            sendSuccess(res, configMaps);
        } catch (error) {
            next(error);
        }
    };

    saveConfigMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as SaveConfigDto;
            if (!dto.name || !dto.namespace || !dto.data) {
                sendError(res, "A név, névtér és kulcs-érték adatok megadása kötelező.", 400);
                return;
            }

            const saved = await this.k8sService.saveConfigMap(dto);

            await this.auditService.logAudit(
                'CONFIG_MAP_UPDATE',
                `ConfigMap mentve: ${dto.namespace}/${dto.name} (${Object.keys(dto.data).length} kulcs)`,
                'SUCCESS'
            );

            sendSuccess(res, saved, `ConfigMap '${dto.name}' sikeresen elmentve.`);
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
                sendError(res, "A névtér és név megadása kötelező.", 400);
                return;
            }

            await this.k8sService.deleteConfigMap(namespace, name);

            await this.auditService.logAudit(
                'CONFIG_MAP_DELETE',
                `ConfigMap törölve: ${namespace}/${name}`,
                'SUCCESS'
            );

            sendSuccess(res, undefined, `ConfigMap '${name}' sikeresen törölve.`);
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
            sendSuccess(res, secrets);
        } catch (error) {
            next(error);
        }
    };

    revealSecret = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = String(req.params.namespace || '');
            const name = String(req.params.name || '');
            if (!namespace || !name) {
                sendError(res, "A névtér és név megadása kötelező.", 400);
                return;
            }

            const revealed = await this.k8sService.revealSecret(namespace, name);

            await this.auditService.logAudit(
                'SECRET_REVEAL',
                `Secret feloldva megtekintésre: ${namespace}/${name}`,
                'SUCCESS'
            );

            sendSuccess(res, revealed);
        } catch (error) {
            next(error);
        }
    };

    saveSecret = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as SaveConfigDto;
            if (!dto.name || !dto.namespace || !dto.data) {
                sendError(res, "A név, névtér és kulcs-érték adatok megadása kötelező.", 400);
                return;
            }

            const saved = await this.k8sService.saveSecret(dto);

            await this.auditService.logAudit(
                'SECRET_UPDATE',
                `Secret mentve: ${dto.namespace}/${dto.name} (${Object.keys(dto.data).length} kulcs)`,
                'SUCCESS'
            );

            sendSuccess(res, saved, `Secret '${dto.name}' sikeresen elmentve.`);
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
                sendError(res, "A névtér és név megadása kötelező.", 400);
                return;
            }

            await this.k8sService.deleteSecret(namespace, name);

            await this.auditService.logAudit(
                'SECRET_DELETE',
                `Secret törölve: ${namespace}/${name}`,
                'SUCCESS'
            );

            sendSuccess(res, undefined, `Secret '${name}' sikeresen törölve.`);
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
                sendError(res, "Névtér és legalább egy workload megadása kötelező az újraindításhoz.", 400);
                return;
            }

            const result = await this.k8sService.restartWorkload(namespace, workloadNames);

            await this.auditService.logAudit(
                'WORKLOAD_RESTART',
                `Workload(ok) újraindítása kezdeményezve (${namespace}): ${workloadNames.join(", ")}`,
                'SUCCESS'
            );

            sendSuccess(res, result, result.message || "Workload újraindítás sikeresen kezdeményezve.");
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
