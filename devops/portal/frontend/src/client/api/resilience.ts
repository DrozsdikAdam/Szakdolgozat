import type { ApiResponse } from "../../types/api";
import type { KillPodRequestDto, KillPodResponseDto, LoadTestDetailDto, LoadTestResponseDto, NetworkTestRequestDto, NetworkTestResponseDto, ResilienceOverviewDto, StartLoadTestDto } from "../../types/resilience";
import { apiClient } from "../apiClient";

const baseUrl = '/api/resilience'

export class ResilienceApi {
    getOverview = async (): Promise<ResilienceOverviewDto> => {
        const response: ApiResponse<ResilienceOverviewDto> = await apiClient(`${baseUrl}/overview`, "GET")
        return response.data!
    }

    triggerPodKill = async (request: KillPodRequestDto): Promise<KillPodResponseDto> => {
        const response: ApiResponse<KillPodResponseDto> = await apiClient(`${baseUrl}/chaos/kill-pod`, "POST", request)
        return response.data!
    }

    startLoadTest = async (request: StartLoadTestDto): Promise<LoadTestResponseDto> => {
        const response: ApiResponse<LoadTestResponseDto> = await apiClient(`${baseUrl}/loadtest/start`, "POST", request)
        return response.data!
    }

    getLoadTestDetails = async (name: string): Promise<LoadTestDetailDto> => {
        const response: ApiResponse<LoadTestDetailDto> = await apiClient(`${baseUrl}/loadtest/${name}`, "GET")
        return response.data!
    }

    testNetworkProxy = async (request: NetworkTestRequestDto): Promise<NetworkTestResponseDto> => {
        const response: ApiResponse<NetworkTestResponseDto> = await apiClient(`${baseUrl}/proxy/test`, "POST", request)
        return response.data!
    }
}