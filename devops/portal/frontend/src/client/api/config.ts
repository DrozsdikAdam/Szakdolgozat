import type { ApiResponse } from "../../types/api";
import type {
    ConfigMapDto,
    SecretDto,
    SecretRevealDto,
    SaveConfigDto,
    RestartWorkloadDto
} from "../../types/config";
import { apiClient } from "../apiClient";

export class ConfigApi {
    getConfigMaps = async (namespace?: string): Promise<ConfigMapDto[]> => {
        let url = "/api/k8s/configs";
        if (namespace && namespace !== "all") {
            url += `?namespace=${encodeURIComponent(namespace)}`;
        }
        const response: ApiResponse<ConfigMapDto[]> = await apiClient(url, "GET");
        return response.data || [];
    };

    saveConfigMap = async (data: SaveConfigDto): Promise<ConfigMapDto> => {
        const response: ApiResponse<ConfigMapDto> = await apiClient("/api/k8s/configs", "POST", data);
        return response.data!;
    };

    deleteConfigMap = async (namespace: string, name: string): Promise<void> => {
        await apiClient(`/api/k8s/configs/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`, "DELETE");
    };

    getSecrets = async (namespace?: string): Promise<SecretDto[]> => {
        let url = "/api/k8s/secrets";
        if (namespace && namespace !== "all") {
            url += `?namespace=${encodeURIComponent(namespace)}`;
        }
        const response: ApiResponse<SecretDto[]> = await apiClient(url, "GET");
        return response.data || [];
    };

    revealSecret = async (namespace: string, name: string): Promise<SecretRevealDto> => {
        const response: ApiResponse<SecretRevealDto> = await apiClient(
            `/api/k8s/secrets/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/reveal`,
            "GET"
        );
        return response.data!;
    };

    saveSecret = async (data: SaveConfigDto): Promise<SecretDto> => {
        const response: ApiResponse<SecretDto> = await apiClient("/api/k8s/secrets", "POST", data);
        return response.data!;
    };

    deleteSecret = async (namespace: string, name: string): Promise<void> => {
        await apiClient(`/api/k8s/secrets/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`, "DELETE");
    };

    restartWorkloads = async (namespace: string, workloadNames: string[]): Promise<RestartWorkloadDto> => {
        const response: ApiResponse<RestartWorkloadDto> = await apiClient("/api/k8s/workloads/restart", "POST", {
            namespace,
            workloadNames
        });
        return response.data!;
    };
}
