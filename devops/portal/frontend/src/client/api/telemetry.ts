import type { ApiResponse } from "../../types/api";
import type { GrafanaDashboardDto, TelemetryOverViewDto, TelemetryTimeRange, WorkloadMetricDto } from "../../types/telemetry";
import { apiClient } from "../apiClient";

export class TelemetryApiClient {
    getOverview = async (timeRange?: TelemetryTimeRange): Promise<TelemetryOverViewDto> => {
        const params = new URLSearchParams();
        if (timeRange) {
            params.append("timeRange", timeRange);
        }

        const response: ApiResponse<TelemetryOverViewDto> = await apiClient("/api/k8s/telemetry/overview" + (params.toString() && "?" + params.toString()), "GET")
        return response.data!;
    }

    getWorkloads = async (namespace?: string): Promise<WorkloadMetricDto[]> => {
        const params = new URLSearchParams();
        if (namespace) {
            params.append("namespace", namespace);
        }
        const response: ApiResponse<WorkloadMetricDto[]> = await apiClient("/api/k8s/telemetry/workloads" + (params.toString() && "?" + params.toString()), "GET")
        return response.data!;
    }

    getDashboards = async (): Promise<GrafanaDashboardDto[]> => {
        const response: ApiResponse<GrafanaDashboardDto[]> = await apiClient("/api/k8s/telemetry/dashboards", "GET")
        return response.data!;
    }
}