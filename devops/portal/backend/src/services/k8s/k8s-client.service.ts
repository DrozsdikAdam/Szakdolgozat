import fs from "node:fs";
import * as k8s from "@kubernetes/client-node";
import { getManagedNamespaces } from "../../constants/namespace.constants.js";

export class K8sClientService {
    private static instance: K8sClientService;

    public readonly kubeConfig: k8s.KubeConfig;
    public readonly coreApi: k8s.CoreV1Api;
    public readonly appsApi: k8s.AppsV1Api;
    public readonly networkApi: k8s.NetworkingV1Api;
    public readonly autoscalingApi: k8s.AutoscalingV1Api;
    public readonly batchApi: k8s.BatchV1Api;
    public readonly customObjectsApi: k8s.CustomObjectsApi;

    private constructor() {
        this.kubeConfig = new k8s.KubeConfig();

        try {
            if (process.env.KUBERNETES_SERVICE_HOST) {
                this.kubeConfig.loadFromCluster();
            } else {
                this.kubeConfig.loadFromDefault();
            }
        } catch (error) {
            try {
                this.kubeConfig.loadFromDefault();
            } catch {
                console.warn("[K8sClientService] Kubeconfig nem található a rendszerben.");
            }
        }

        const isInContainer = Boolean(
            process.env.KUBERNETES_SERVICE_HOST ||
            process.env.IS_DOCKER ||
            fs.existsSync("/.dockerenv")
        );

        if (isInContainer && process.env.K8S_SERVER_HOST) {
            this.kubeConfig.clusters.forEach((c) => {
                const mutableCluster = c as { server: string; skipTLSVerify?: boolean };
                mutableCluster.server = mutableCluster.server
                    .replace('127.0.0.1', process.env.K8S_SERVER_HOST!)
                    .replace('localhost', process.env.K8S_SERVER_HOST!);
                mutableCluster.skipTLSVerify = true;
            });
        }

        this.coreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
        this.appsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
        this.networkApi = this.kubeConfig.makeApiClient(k8s.NetworkingV1Api);
        this.autoscalingApi = this.kubeConfig.makeApiClient(k8s.AutoscalingV1Api);
        this.batchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
        this.customObjectsApi = this.kubeConfig.makeApiClient(k8s.CustomObjectsApi);
    }

    public static getInstance(): K8sClientService {
        if (!K8sClientService.instance) {
            K8sClientService.instance = new K8sClientService();
        }
        return K8sClientService.instance;
    }

    public static resolveNamespaces(namespace?: string): string[] {
        return namespace && namespace !== 'all'
            ? [namespace]
            : getManagedNamespaces();
    }
}
