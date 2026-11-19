import type { ApiResponse } from "../../types/api";
import type { AuditResponseDto } from "../../types/audit";
import { apiClient } from "../apiClient";

export class AuditApi {
    getLogs = async (limit: number = 50): Promise<AuditResponseDto[]> => {
        const response: ApiResponse<AuditResponseDto[]> = await apiClient(`/api/audit/logs?limit=${limit}`, "GET");
        return response.data ?? [];
    }
}