import type { ApiResponse } from "../../types/api";
import type {
    ClusterOverviewDto,
    K8sEventDto,
    PodLogsResponseDto,
    RateLimitResponseDto,
    UpdateHpaDto,
    UpdateRateLimitDto,
    UpdateVpaDto,
    VpaOverviewDto,
} from "../../types/k8s";
import { apiClient } from "../apiClient";

export class K8sApi {

    getOverview = async (): Promise<ClusterOverviewDto> => {
        const response: ApiResponse<ClusterOverviewDto> = await apiClient("/api/k8s/overview", "GET");
        return response.data!;
    }

    getRateLimit = async (): Promise<RateLimitResponseDto> => {
        const response: ApiResponse<RateLimitResponseDto> = await apiClient("/api/k8s/ratelimit", "GET");
        return response.data!;
    }

    updateRateLimit = async (request: UpdateRateLimitDto): Promise<void> => {
        await apiClient("/api/k8s/ratelimit", "PUT", request);
    }

    getHpa = async (): Promise<UpdateHpaDto> => {
        const response: ApiResponse<UpdateHpaDto> = await apiClient("/api/k8s/hpa", "GET");
        return response.data!;
    }

    updateHpa = async (request: UpdateHpaDto): Promise<void> => {
        await apiClient("/api/k8s/hpa", "PUT", request);
    }

    getVpa = async (): Promise<VpaOverviewDto> => {
        const response: ApiResponse<VpaOverviewDto> = await apiClient("/api/k8s/vpa", "GET");
        return response.data!;
    }

    updateVpa = async (request: UpdateVpaDto): Promise<void> => {
        await apiClient("/api/k8s/vpa", "PUT", request);
    }

    getPodLogs = async (namespace: string, podName: string, tail = 150, container?: string): Promise<PodLogsResponseDto> => {
        let url = `/api/k8s/pods/${encodeURIComponent(namespace)}/${encodeURIComponent(podName)}/logs?tail=${tail}`;
        if (container) {
            url += `&container=${encodeURIComponent(container)}`;
        }
        const response: ApiResponse<PodLogsResponseDto> = await apiClient(url, "GET");
        return response.data!;
    }

    getEvents = async (namespace?: string, podName?: string): Promise<K8sEventDto[]> => {
        let url = "/api/k8s/events";
        const params = new URLSearchParams();
        if (namespace) params.set("namespace", namespace);
        if (podName) params.set("podName", podName);
        const qs = params.toString();
        if (qs) url += `?${qs}`;
        const response: ApiResponse<K8sEventDto[]> = await apiClient(url, "GET");
        return response.data!;
    }

    getNamespaces = async (): Promise<string[]> => {
        const response: ApiResponse<string[]> = await apiClient("/api/k8s/namespaces", "GET");
        return response.data || [];
    }
}