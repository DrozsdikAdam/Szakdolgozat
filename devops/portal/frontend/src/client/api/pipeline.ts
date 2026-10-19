import type { GitOpsDriftReport, ManualApprovalRequest, PipelineJobResponseDto, PipelineRun, RolloutActionRequest } from "../../types/pipeline";
import { apiClient } from "../apiClient";
import type { ApiResponse } from "../../types/api";

const BASE_PATH = "/api/pipelines"

export class PipelineApi {
    getPipelineRuns = async (): Promise<PipelineRun[]> => {
        const response: ApiResponse<PipelineRun[]> = await apiClient(`${BASE_PATH}`, "GET")
        return response.data!;
    }

    triggerPipeline = async (branch?: string): Promise<PipelineJobResponseDto> => {
        const response: ApiResponse<PipelineJobResponseDto> = await apiClient(`${BASE_PATH}/trigger`, "POST", { branch })
        return response.data!;
    }

    approvePipeline = async (runId: string, request: ManualApprovalRequest): Promise<PipelineJobResponseDto> => {
        const response: ApiResponse<PipelineJobResponseDto> = await apiClient(`${BASE_PATH}/${runId}/approve`, "POST", request)
        return response.data!;
    }

    getGitOpsDrift = async (): Promise<GitOpsDriftReport> => {
        const response: ApiResponse<GitOpsDriftReport> = await apiClient(`${BASE_PATH}/gitops-drift`, "GET")
        return response.data!;
    }

    executeRolloutAction = async (request: RolloutActionRequest): Promise<PipelineJobResponseDto> => {
        const response: ApiResponse<PipelineJobResponseDto> = await apiClient(`${BASE_PATH}/rollout/action`, "POST", request)
        return response.data!;
    }

    getPipelineConfig = async (): Promise<{ defaultStrategy: 'canary' | 'bluegreen'; defaultAppName: string; appNamespace: string }> => {
        const response: ApiResponse<{ defaultStrategy: 'canary' | 'bluegreen'; defaultAppName: string; appNamespace: string }> = await apiClient(`${BASE_PATH}/config`, "GET");
        return response.data!;
    }

    updatePipelineStrategy = async (strategy: 'canary' | 'bluegreen'): Promise<{ strategy: string }> => {
        const response: ApiResponse<{ strategy: string }> = await apiClient(`${BASE_PATH}/strategy`, "PUT", { strategy });
        return response.data!;
    }
}