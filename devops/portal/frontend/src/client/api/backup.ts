import type { ApiResponse } from "../../types/api";
import type { BackupHistoryResponseDto, JobTriggerResponseDto } from "../../types/backup";
import { apiClient } from "../apiClient";

export class BackupApi {
    getHistory = async (): Promise<BackupHistoryResponseDto> => {
        const response: ApiResponse<BackupHistoryResponseDto> = await apiClient("/api/backups/history", "GET");
        return response.data!;
    }

    triggerBackup = async (): Promise<JobTriggerResponseDto> => {
        const response: ApiResponse<JobTriggerResponseDto> = await apiClient("/api/backups/trigger", "POST");
        return response.data!;
    }

    triggerRestore = async (targetBackup: string = 'latest'): Promise<JobTriggerResponseDto> => {
        const response: ApiResponse<JobTriggerResponseDto> = await apiClient("/api/backups/restore", "POST", { targetBackup });
        return response.data!;
    }
}