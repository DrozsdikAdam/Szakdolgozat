import * as k8s from "@kubernetes/client-node";
import { K8sClientService } from "./k8s-client.service.js";
import { K8sMapper } from "../../mappers/k8s.mapper.js";
import type {
    ConfigMapDto,
    SecretDto,
    SecretRevealDto,
    SaveConfigDto,
    RestartWorkloadDto
} from "../../dtos/config.dto.js";

export class K8sConfigService {
    private client: K8sClientService;
    private mapper: K8sMapper;

    constructor() {
        this.client = K8sClientService.getInstance();
        this.mapper = new K8sMapper();
    }

    getConfigMaps = async (namespace?: string): Promise<ConfigMapDto[]> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const configMaps: ConfigMapDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const configMapList = await this.client.coreApi.listNamespacedConfigMap({ namespace: ns });
                    for (const item of configMapList.items || []) {
                        const cmName = item.metadata?.name || '';
                        const bound = await this.getBoundWorkloads(ns, cmName, false);
                        configMaps.push({
                            name: cmName,
                            namespace: item.metadata?.namespace || ns,
                            data: (item.data as Record<string, string>) || {},
                            keyCount: Object.keys(item.data || {}).length,
                            createdAt: (item.metadata?.creationTimestamp || new Date()).toString(),
                            boundWorkloads: bound
                        });
                    }
                } catch (nsErr) {
                    console.warn(`[K8sConfigService] Hiba a configMapek lekérésekor a '${ns}' névtérből:`, (nsErr as any)?.message || nsErr);
                }
            }

            configMaps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return configMaps;
        } catch (error) {
            console.warn('[K8sConfigService] Hiba a configMapek lekérésekor:', (error as any)?.message || error);
            return [];
        }
    };

    getSecrets = async (namespace?: string): Promise<SecretDto[]> => {
        try {
            const targetNamespaces = K8sClientService.resolveNamespaces(namespace);
            const secrets: SecretDto[] = [];

            for (const ns of targetNamespaces) {
                try {
                    const secretList = await this.client.coreApi.listNamespacedSecret({ namespace: ns });
                    for (const item of secretList.items || []) {
                        const secName = item.metadata?.name || '';
                        const rawData = item.data || {};
                        const keys = Object.keys(rawData);
                        const maskedData = this.mapper.maskSecretData(rawData);

                        const bound = await this.getBoundWorkloads(ns, secName, true);

                        secrets.push({
                            name: secName,
                            namespace: item.metadata?.namespace || ns,
                            secretType: item.type || 'Opaque',
                            data: maskedData,
                            keys,
                            keyCount: keys.length,
                            isMasked: true,
                            createdAt: (item.metadata?.creationTimestamp || new Date()).toString(),
                            boundWorkloads: bound
                        });
                    }
                } catch (nsErr) {
                    console.warn(`[K8sConfigService] Hiba a titkok lekérésekor a '${ns}' névtérből:`, (nsErr as any)?.message || nsErr);
                }
            }

            secrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return secrets;
        } catch (error) {
            console.warn('[K8sConfigService] Hiba a titkok lekérésekor:', (error as any)?.message || error);
            return [];
        }
    };

    revealSecret = async (namespace: string, name: string): Promise<SecretRevealDto> => {
        try {
            const secret = await this.client.coreApi.readNamespacedSecret({ name, namespace });
            const rawData = secret.data || {};
            const revealedData: Record<string, string> = {};

            for (const [key, base64Val] of Object.entries(rawData)) {
                try {
                    revealedData[key] = Buffer.from(base64Val, 'base64').toString('utf-8');
                } catch {
                    revealedData[key] = String(base64Val);
                }
            }

            return {
                name,
                namespace,
                data: revealedData
            };
        } catch (error) {
            console.error(`[K8sConfigService] Nem sikerült feloldani a titkot (${name}):`, error);
            throw new Error(`Nem sikerült kiolvasni a titok adatait: ${(error as any)?.message || error}`);
        }
    };

    saveConfigMap = async (dto: SaveConfigDto): Promise<ConfigMapDto> => {
        try {
            let exists = false;
            try {
                await this.client.coreApi.readNamespacedConfigMap({ name: dto.name, namespace: dto.namespace });
                exists = true;
            } catch {
                exists = false;
            }

            const cmBody: k8s.V1ConfigMap = {
                metadata: {
                    name: dto.name,
                    namespace: dto.namespace
                },
                data: dto.data
            };

            if (exists) {
                await this.client.coreApi.replaceNamespacedConfigMap({
                    name: dto.name,
                    namespace: dto.namespace,
                    body: cmBody
                });
            } else {
                await this.client.coreApi.createNamespacedConfigMap({
                    namespace: dto.namespace,
                    body: cmBody
                });
            }

            const bound = await this.getBoundWorkloads(dto.namespace, dto.name, false);
            return {
                name: dto.name,
                namespace: dto.namespace,
                data: dto.data,
                keyCount: Object.keys(dto.data).length,
                createdAt: new Date().toISOString(),
                boundWorkloads: bound
            };
        } catch (error) {
            console.error(`[K8sConfigService] Hiba a ConfigMap mentésekor (${dto.name}):`, error);
            throw new Error(`Nem sikerült elmenteni a ConfigMap-et: ${(error as any)?.message || error}`);
        }
    };

    deleteConfigMap = async (namespace: string, name: string): Promise<boolean> => {
        try {
            await this.client.coreApi.deleteNamespacedConfigMap({ name, namespace });
            return true;
        } catch (error) {
            console.error(`[K8sConfigService] Hiba a ConfigMap törlésekor (${name}):`, error);
            throw new Error(`Nem sikerült törölni a ConfigMap-et: ${(error as any)?.message || error}`);
        }
    };

    saveSecret = async (dto: SaveConfigDto): Promise<SecretDto> => {
        try {
            let exists = false;
            let existingData: Record<string, string> = {};
            try {
                const existingSecret = await this.client.coreApi.readNamespacedSecret({ name: dto.name, namespace: dto.namespace });
                exists = true;
                if (existingSecret?.data) {
                    for (const [k, v] of Object.entries(existingSecret.data)) {
                        existingData[k] = Buffer.from(v, 'base64').toString('utf-8');
                    }
                }
            } catch {
                exists = false;
            }

            const mergedData = { ...existingData, ...dto.data };

            const secretBody: k8s.V1Secret = {
                metadata: {
                    name: dto.name,
                    namespace: dto.namespace
                },
                type: dto.secretType || 'Opaque',
                stringData: mergedData
            };

            if (exists) {
                await this.client.coreApi.replaceNamespacedSecret({
                    name: dto.name,
                    namespace: dto.namespace,
                    body: secretBody
                });
            } else {
                await this.client.coreApi.createNamespacedSecret({
                    namespace: dto.namespace,
                    body: secretBody
                });
            }

            const keys = Object.keys(dto.data);
            const maskedData = this.mapper.maskSecretData(dto.data);

            const bound = await this.getBoundWorkloads(dto.namespace, dto.name, true);
            return {
                name: dto.name,
                namespace: dto.namespace,
                secretType: dto.secretType || 'Opaque',
                data: maskedData,
                keys,
                keyCount: keys.length,
                isMasked: true,
                createdAt: new Date().toISOString(),
                boundWorkloads: bound
            };
        } catch (error) {
            console.error(`[K8sConfigService] Hiba a Secret mentésekor (${dto.name}):`, error);
            throw new Error(`Nem sikerült elmenteni a Secret-et: ${(error as any)?.message || error}`);
        }
    };

    deleteSecret = async (namespace: string, name: string): Promise<boolean> => {
        try {
            await this.client.coreApi.deleteNamespacedSecret({ name, namespace });
            return true;
        } catch (error) {
            console.error(`[K8sConfigService] Hiba a Secret törlésekor (${name}):`, error);
            throw new Error(`Nem sikerült törölni a Secret-et: ${(error as any)?.message || error}`);
        }
    };

    restartWorkload = async (namespace: string, workloadNames: string[]): Promise<RestartWorkloadDto> => {
        const restartedAt = new Date().toISOString();
        const successNames: string[] = [];

        for (const name of workloadNames) {
            try {
                const dep = await this.client.appsApi.readNamespacedDeployment({ name, namespace });
                if (dep.spec?.template) {
                    if (!dep.spec.template.metadata) {
                        dep.spec.template.metadata = {};
                    }
                    if (!dep.spec.template.metadata.annotations) {
                        dep.spec.template.metadata.annotations = {};
                    }

                    dep.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = restartedAt;

                    await this.client.appsApi.replaceNamespacedDeployment({
                        name,
                        namespace,
                        body: dep
                    });
                    successNames.push(name);
                }
            } catch (err) {
                try {
                    const { exec } = await import('child_process');
                    const { promisify } = await import('util');
                    const execAsync = promisify(exec);
                    const k8sFlag = process.env.K8S_SERVER_HOST ? `--server=https://${process.env.K8S_SERVER_HOST}:61682 --insecure-skip-tls-verify=true` : '';
                    await execAsync(`kubectl ${k8sFlag} patch rollout ${name} -n ${namespace} --type=merge -p '{"spec":{"template":{"metadata":{"annotations":{"kubectl.kubernetes.io/restartedAt":"${restartedAt}"}}}}}'`);
                    successNames.push(name);
                } catch {
                    console.warn(`[K8sConfigService] Nem sikerült újraindítani a '${name}' workloadot (deployment vagy rollout):`, (err as any)?.message || err);
                }
            }
        }

        return {
            namespace,
            workloadNames: successNames,
            restartedAt,
            message: `${successNames.length} workload sikeresen újraindítva.`
        };
    };

    getBoundWorkloads = async (namespace: string, configName: string, isSecret: boolean): Promise<string[]> => {
        try {
            const deploys = await this.client.appsApi.listNamespacedDeployment({ namespace });
            const bound: string[] = [];
            for (const dep of deploys.items || []) {
                const depName = dep.metadata?.name || '';
                const containers = dep.spec?.template?.spec?.containers || [];
                let isUsed = false;

                for (const c of containers) {
                    if (isSecret) {
                        if (c.envFrom?.some(ef => ef.secretRef?.name === configName)) isUsed = true;
                        if (c.env?.some(e => e.valueFrom?.secretKeyRef?.name === configName)) isUsed = true;
                    } else {
                        if (c.envFrom?.some(ef => ef.configMapRef?.name === configName)) isUsed = true;
                        if (c.env?.some(e => e.valueFrom?.configMapKeyRef?.name === configName)) isUsed = true;
                    }
                }

                const volumes = dep.spec?.template?.spec?.volumes || [];
                for (const v of volumes) {
                    if (isSecret && v.secret?.secretName === configName) isUsed = true;
                    if (!isSecret && v.configMap?.name === configName) isUsed = true;
                }

                if (isUsed && !bound.includes(depName)) {
                    bound.push(depName);
                }
            }
            return bound;
        } catch {
            return [];
        }
    };
}
