import type { Request, Response, NextFunction } from "express";
import { K8sService } from "../services/k8s.service.js";
import { sendSuccess } from "../utils/response.util.js";
import type {
    UpdateHpaDto,
    UpdateRateLimitDto,
    UpdateVpaDto,
} from "../dtos/k8s.dto.js";

export class K8sController {
    private k8sService: K8sService;

    constructor() {
        this.k8sService = new K8sService();
    }

    getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const overview = await this.k8sService.getClusterOverView();
            sendSuccess(res, overview);
        } catch (error) {
            next(error);
        }
    };

    getRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = (req.query.namespace as string) || "app-mes";
            const ingressName = (req.query.ingressName as string) || "mes-ingress";
            const rateLimit = await this.k8sService.getRateLimit(namespace, ingressName);
            sendSuccess(res, rateLimit);
        } catch (error) {
            next(error);
        }
    };

    updateRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = (req.query.namespace as string) || "app-mes";
            const ingressName = (req.query.ingressName as string) || "mes-ingress";
            await this.k8sService.updateRateLimit(req.body as UpdateRateLimitDto, namespace, ingressName);
            sendSuccess(res, undefined, `Rate limit updated to ${req.body.rps} RPS`);
        } catch (error) {
            next(error);
        }
    };

    getHpa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = (req.query.namespace as string) || "app-mes";
            const name = (req.query.name as string) || "mes-backend-hpa";
            const hpa = await this.k8sService.getHpa(namespace, name);
            sendSuccess(res, hpa);
        } catch (error) {
            next(error);
        }
    };

    updateHpa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = (req.query.namespace as string) || "app-mes";
            const name = (req.query.name as string) || "mes-backend-hpa";
            await this.k8sService.updateHpa(req.body as UpdateHpaDto, namespace, name);
            sendSuccess(res, undefined, "HPA autoscaling limits updated successfully");
        } catch (error) {
            next(error);
        }
    };

    getVpa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = (req.query.namespace as string) || "app-mes";
            const name = (req.query.name as string) || "mes-backend-vpa";
            const vpa = await this.k8sService.getVpa(namespace, name);
            sendSuccess(res, vpa);
        } catch (error) {
            next(error);
        }
    };

    updateVpa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = (req.query.namespace as string) || "app-mes";
            const name = (req.query.name as string) || "mes-backend-vpa";
            await this.k8sService.updateVpa(req.body as UpdateVpaDto, namespace, name);
            sendSuccess(res, undefined, "VPA settings updated successfully");
        } catch (error) {
            next(error);
        }
    };

    getPodLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = String(req.params.namespace || "platform-infra");
            const podName = String(req.params.podName || "");
            const tail = req.query.tail ? Number(req.query.tail) : 150;
            const container = req.query.container ? String(req.query.container) : undefined;
            const logs = await this.k8sService.getPodLogs(namespace, podName, tail, container);
            sendSuccess(res, logs);
        } catch (error) {
            next(error);
        }
    };

    getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const namespace = req.query.namespace as string | undefined;
            const podName = req.query.podName as string | undefined;
            const events = await this.k8sService.getClusterEvents(namespace, podName);
            sendSuccess(res, events);
        } catch (error) {
            next(error);
        }
    };
}
