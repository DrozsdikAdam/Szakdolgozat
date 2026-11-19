import type { ApiResponse } from "../../types/api";
import type {
    BackupHistoryResponseDto,
    JobTriggerResponseDto,
    BackupTargetDto,
    BackupTargetUpdateDto,
    BackupTargetTestDto,
    BackupTargetTestResultDto
} from "../../types/backup";
import { apiClient } from "../apiClient";

export class BackupApi {
    getHistory = async (): Promise<BackupHistoryResponseDto> => {
        const response: ApiResponse<BackupHistoryResponseDto> = await apiClient("/api/backups/history", "GET");
        return response.data!;
    }

    getTarget = async (): Promise<BackupTargetDto> => {
        const response: ApiResponse<BackupTargetDto> = await apiClient("/api/backups/target", "GET");
        return response.data!;
    }

    saveTarget = async (dto: BackupTargetUpdateDto): Promise<void> => {
        await apiClient("/api/backups/target", "PUT", dto);
    }

    testTarget = async (dto: BackupTargetTestDto): Promise<BackupTargetTestResultDto> => {
        const response: ApiResponse<BackupTargetTestResultDto> = await apiClient("/api/backups/target/test", "POST", dto);
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
