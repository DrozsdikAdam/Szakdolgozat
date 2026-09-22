import type { ApiResponse } from "../../types/api";
import type { ProbeTestResultDto, UpdateProbeDto, WorkloadHealthDto } from "../../types/healthcheck";
import { apiClient } from "../apiClient";

export class HealthcheckApi {
    getHealthchecks = async (namespace?: string): Promise<WorkloadHealthDto[]> => {
        let url = "/api/k8s/healthchecks";
        if (namespace && namespace !== "all") {
            url += `?namespace=${encodeURIComponent(namespace)}`;
        }
        const response: ApiResponse<WorkloadHealthDto[]> = await apiClient(url, "GET");
        return response.data || [];
    }

    updateProbe = async (data: UpdateProbeDto): Promise<WorkloadHealthDto> => {
        const response: ApiResponse<WorkloadHealthDto> = await apiClient("/api/k8s/healthchecks", "PUT", data);
        return response.data!;
    }

    testProbe = async (namespace: string, deploymentName: string, path: string = "/actuator/health", port?: number | string): Promise<ProbeTestResultDto> => {
        const response: ApiResponse<ProbeTestResultDto> = await apiClient(
            "/api/k8s/healthchecks/test",
            "POST",
            { namespace, deploymentName, path, port: port ?? 8080 }
        );
        return response.data!;
    }

}