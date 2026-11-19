import type { ApiResponse } from "../../types/api";
import type { DeploymentsOverviewDto, RollbackDeploymentDto, UpdateDeploymentStrategyDto, WorkloadDeploymentDto } from "../../types/deployments";
import { apiClient } from "../apiClient";

export class DeploymentApi {

    getDeployments = async (namespace?: string): Promise<DeploymentsOverviewDto> => {
        let url = "/api/k8s/deployments";
        if (namespace && namespace !== "all") {
            url += `?namespace=${encodeURIComponent(namespace)}`;
        }
        const response: ApiResponse<DeploymentsOverviewDto> = await apiClient(url, "GET");
        return response.data!;
    }

    syncGitOps = async (): Promise<DeploymentsOverviewDto> => {
        const response: ApiResponse<DeploymentsOverviewDto> = await apiClient("/api/k8s/deployments/sync", "POST");
        return response.data!;
    }

    updateStrategy = async (dto: UpdateDeploymentStrategyDto): Promise<WorkloadDeploymentDto> => {
        const response: ApiResponse<WorkloadDeploymentDto> = await apiClient("/api/k8s/deployments/strategy", "PUT", dto);
        return response.data!;
    }

    rollback = async (dto: RollbackDeploymentDto): Promise<WorkloadDeploymentDto> => {
        const response: ApiResponse<WorkloadDeploymentDto> = await apiClient("/api/k8s/deployments/rollback", "POST", dto);
        return response.data!;
    }

}