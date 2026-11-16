import * as k8s from "@kubernetes/client-node";
import { K8sClientService } from "./k8s-client.service.js";
import {
    DEFAULT_APP_NAMESPACE,
    DEFAULT_PLATFORM_NAMESPACE
} from "../../constants/namespace.constants.js";
import { K8sMapper } from "../../mappers/k8s.mapper.js";
import type {
    ClusterOverviewDto,
    K8sEventDto,
    PodLogsResponseDto
} from "../../dtos/k8s.dto.js";

export class K8sPodService {
    private client: K8sClientService;
    private mapper: K8sMapper;
    private static overviewCache: { data: ClusterOverviewDto; expiresAt: number } | null = null;
    private static overviewInFlight: Promise<ClusterOverviewDto> | null = null;

    constructor() {
        this.client = K8sClientService.getInstance();
        this.mapper = new K8sMapper();
    }

    getClusterOverView = async (): Promise<ClusterOverviewDto> => {
        const now = Date.now();
        if (K8sPodService.overviewCache && now < K8sPodService.overviewCache.expiresAt) {
            return K8sPodService.overviewCache.data;
        }
        if (K8sPodService.overviewInFlight) {
            return K8sPodService.overviewInFlight;
        }

        const promise = (async (): Promise<ClusterOverviewDto> => {
            try {
                const [platformPods, appPods] = await Promise.all([
                    this.client.coreApi.listNamespacedPod({ namespace: DEFAULT_PLATFORM_NAMESPACE }),
                    this.client.coreApi.listNamespacedPod({ namespace: DEFAULT_APP_NAMESPACE })
                ]);

                const platPodInfo = this.mapper.toPodInfos(platformPods.items ?? []);
                const appPodInfo = this.mapper.toPodInfos(appPods.items ?? []);

                const result: ClusterOverviewDto = {
                    platformPods: platPodInfo,
                    appPods: appPodInfo,
                    timestamp: new Date().toISOString()
                };
                K8sPodService.overviewCache = { data: result, expiresAt: Date.now() + 2000 };
                return result;
            } catch (error) {
                console.warn("[K8sPodService] Nem sikerült elérni a valós K8s API-t (üres lista visszaadása):", (error as any)?.message || error);
                return {
                    platformPods: [],
                    appPods: [],
                    timestamp: new Date().toISOString()
                };
            } finally {
                K8sPodService.overviewInFlight = null;
            }
        })();

        K8sPodService.overviewInFlight = promise;
        return promise;
    };

    getPodLogs = async (namespace: string, podName: string, tailLines = 150, container?: string): Promise<PodLogsResponseDto> => {
        let containerName = container || "";
        try {
            if (!containerName) {
                try {
                    const pod = await this.client.coreApi.readNamespacedPod({ name: podName, namespace });
                    containerName = pod.spec?.containers?.[0]?.name || podName;
                } catch {
                    containerName = podName;
                }
            }

            const logRequest: k8s.CoreV1ApiReadNamespacedPodLogRequest = {
                name: podName,
                namespace,
                tailLines
            };
            if (containerName) {
                logRequest.container = containerName;
            }

            const rawLogs = await this.client.coreApi.readNamespacedPodLog(logRequest);

            const lines = (typeof rawLogs === "string" ? rawLogs : String(rawLogs || ""))
                .split("\n")
                .filter(l => l.trim().length > 0);

            return {
                podName,
                namespace,
                containerName,
                lines: lines.length > 0 ? lines : ["[INFO] A konténer fut, de még nem generált naplókimenetet."],
                totalLines: lines.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn(`[K8sPodService] Nem sikerült kiolvasni a pod (${podName}) logjait:`, (error as any)?.message || error);
            return {
                podName,
                namespace,
                containerName: containerName || podName,
                lines: [
                    `[WARN] A Kubernetes API-ból nem sikerült lekérni a naplót: ${(error as any)?.message || error}`,
                    `[INFO] Ellenőrizd, hogy a pod fut-e és a konténer neve helyes-e (${containerName || "default"}).`
                ],
                totalLines: 2,
                timestamp: new Date().toISOString()
            };
        }
    };

    getClusterEvents = async (namespace?: string, podName?: string): Promise<K8sEventDto[]> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const perNs = await Promise.all(targetNamespaces.map(async (ns): Promise<K8sEventDto[]> => {
                const list: K8sEventDto[] = [];
                try {
                    const eventList = await this.client.coreApi.listNamespacedEvent({ namespace: ns });
                    for (const item of eventList.items || []) {
                        if (podName && item.involvedObject?.name !== podName) {
                            continue;
                        }

                        list.push({
                            id: item.metadata?.uid || `${item.metadata?.name}-${Date.now()}`,
                            type: item.type === "Warning" ? "Warning" : "Normal",
                            reason: item.reason || "Ismeretlen",
                            message: item.message || "",
                            involvedObjectName: item.involvedObject?.name || "",
                            involvedObjectKind: item.involvedObject?.kind || "",
                            namespace: item.involvedObject?.namespace || ns,
                            count: item.count || 1,
                            firstTimestamp: item.firstTimestamp?.toString(),
                            lastTimestamp: (item.lastTimestamp || item.eventTime || item.metadata?.creationTimestamp || new Date()).toString(),
                            sourceComponent: item.source?.component || item.reportingComponent
                        });
                    }
                } catch (nsErr) {
                    console.warn(`[K8sPodService] Hiba az események lekérésekor a '${ns}' névtérből:`, (nsErr as any)?.message || nsErr);
                }
                return list;
            }));

            const allEvents = perNs.flat();
            allEvents.sort((a, b) => {
                const dateA = new Date(a.lastTimestamp).getTime();
                const dateB = new Date(b.lastTimestamp).getTime();
                return dateB - dateA;
            });

            return allEvents;
        } catch (error) {
            console.warn("[K8sPodService] Hiba a K8s események lekérésekor:", (error as any)?.message || error);
            return [];
        }
    };
}
