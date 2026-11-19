import { K8sClientService } from "./k8s-client.service.js";
import { DEFAULT_APP_NAMESPACE } from "../../constants/namespace.constants.js";
import type { RateLimitResponseDto, UpdateRateLimitDto } from "../../dtos/k8s.dto.js";
import { FeatureFlag } from "../../models/FeatureFlag.js";

export class K8sIngressService {
    private client: K8sClientService;

    constructor() {
        this.client = K8sClientService.getInstance();
    }

    getRateLimit = async (namespace = DEFAULT_APP_NAMESPACE, ingressName = "mes-ingress"): Promise<RateLimitResponseDto> => {
        try {
            const ingress = await this.client.networkApi.readNamespacedIngress({ name: ingressName, namespace });
            const rpsAnnotation = ingress.metadata?.annotations?.["nginx.ingress.kubernetes.io/limit-rps"];
            const burstAnnotation = ingress.metadata?.annotations?.["nginx.ingress.kubernetes.io/limit-burst-multiplier"];
            const rps = rpsAnnotation ? Number(rpsAnnotation) : 0;
            const burst = burstAnnotation ? Number(burstAnnotation) : 0;
            if (rps > 0) {
                return {
                    rps,
                    burst: burst > 0 ? burst : 5,
                    isConfigured: true
                };
            }
        } catch (error) {
            console.warn("[K8sIngressService] Rate limit nem érhető el vagy nincs Ingress:", (error as any)?.message || error);
        }

        try {
            const flag = await FeatureFlag.findOne({ where: { name: 'rate_limiting' } });
            if (flag) {
                const rps = Number(flag.params?.rps ?? (flag.enabled ? 100 : 0));
                const burst = Number(flag.params?.burst ?? 5);
                return {
                    rps,
                    burst: burst > 0 ? burst : 5,
                    isConfigured: Boolean(flag.enabled && rps > 0)
                };
            }
        } catch (dbError) {
            console.warn("[K8sIngressService] DB fallback rate limit lekérdezési hiba:", dbError);
        }

        return { rps: 0, burst: 0, isConfigured: false };
    };

    updateRateLimit = async (request: UpdateRateLimitDto, namespace = DEFAULT_APP_NAMESPACE, ingressName = "mes-ingress"): Promise<void> => {
        try {
            const [flag] = await FeatureFlag.findOrCreate({
                where: { name: 'rate_limiting' },
                defaults: {
                    name: 'rate_limiting',
                    enabled: request.rps > 0,
                    params: { rps: request.rps, burst: request.burst ?? 5 }
                }
            });
            flag.enabled = request.rps > 0;
            flag.params = { ...(flag.params || {}), rps: request.rps, burst: request.burst ?? 5 };
            await flag.save();
        } catch (dbError) {
            console.warn("[K8sIngressService] Nem sikerült a FeatureFlag adatbázis szinkronizációja:", dbError);
        }

        try {
            const ingress = await this.client.networkApi.readNamespacedIngress({
                name: ingressName,
                namespace,
            });

            if (!ingress.metadata) ingress.metadata = {};
            if (!ingress.metadata.annotations) ingress.metadata.annotations = {};

            ingress.metadata.annotations["nginx.ingress.kubernetes.io/limit-rps"] = String(request.rps);
            if (request.burst !== undefined) {
                ingress.metadata.annotations["nginx.ingress.kubernetes.io/limit-burst-multiplier"] = String(request.burst);
            }

            await this.client.networkApi.replaceNamespacedIngress({
                name: ingressName,
                namespace,
                body: ingress
            });
        } catch (error) {
            console.error("[K8sIngressService] Error updating rate limit:", error);
            console.warn("[K8sIngressService] Ingress nem érhető el, a beállítás helyi környezetben szimulálva.");
        }
    };

    setMaintenanceMode = async (enabled: boolean, namespace = DEFAULT_APP_NAMESPACE, ingressName = "mes-ingress"): Promise<{ success: boolean; message: string }> => {
        try {
            const ingress = await this.client.networkApi.readNamespacedIngress({ name: ingressName, namespace });
            if (!ingress.metadata) ingress.metadata = {};
            if (!ingress.metadata.annotations) ingress.metadata.annotations = {};

            if (enabled) {
                ingress.metadata.annotations["nginx.ingress.kubernetes.io/server-snippet"] =
                    'return 503 "A rendszer karbantartas alatt all. Kerjuk latogasson vissza kesobb.";';
                ingress.metadata.annotations["platform.devops.io/maintenance-mode"] = "true";
                console.log("[K8sIngressService] Karbantartási üzemmód (503 Service) bekapcsolva az Ingress rétegen.");
            } else {
                delete ingress.metadata.annotations["nginx.ingress.kubernetes.io/server-snippet"];
                delete ingress.metadata.annotations["platform.devops.io/maintenance-mode"];
                console.log("[K8sIngressService] Karbantartási üzemmód kikapcsolva, normál forgalom visszaállítva.");
            }

            await this.client.networkApi.replaceNamespacedIngress({ name: ingressName, namespace, body: ingress });
            return { success: true, message: `Karbantartási üzemmód ${enabled ? "bekapcsolva" : "kikapcsolva"}` };
        } catch (error) {
            console.warn("[K8sIngressService] Ingress nem érhető el (pl. helyi fejlesztés), karbantartási üzemmód szimulálva:", (error as any)?.message || error);
            return { success: true, message: `Karbantartási üzemmód szimulálva: ${enabled ? "AKTÍV" : "INAKTÍV"}` };
        }
    };
}
