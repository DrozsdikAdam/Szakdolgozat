import type { ApiResponse } from "../../types/api";
import type { ClusterOverviewDto, UpdateHpaDto, UpdateRateLimitDto, UpdateVpaDto, VpaOverviewDto } from "../../types/k8s";
import { apiClient } from "../apiClient";

export class K8sApi {

    getOverview = async (): Promise<ClusterOverviewDto> => {
        const response: ApiResponse<ClusterOverviewDto> = await apiClient("/api/k8s/overview", "GET");
        return response.data!;
    }

    getRateLimit = async (): Promise<{ rps: number }> => {
        const response: ApiResponse<{ rps: number }> = await apiClient("/api/k8s/ratelimit", "GET");
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

}