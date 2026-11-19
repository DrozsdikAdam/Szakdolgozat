import type { ApiResponse } from "../../types/api";
import type {
    StorageConfigUpdateDto,
    StorageOverViewDto,
    StorageTestRequestDto,
    StorageTestResponseDto
} from "../../types/storage";
import { apiClient } from "../apiClient";

const baseUrl = '/api/storage';

export class StorageApi {
    getOverview = async (): Promise<StorageOverViewDto> => {
        const response: ApiResponse<StorageOverViewDto> = await apiClient(`${baseUrl}/overview`, "GET");
        return response.data!;
    };

    saveConfig = async (dto: StorageConfigUpdateDto): Promise<{ success: boolean; message: string }> => {
        const response: ApiResponse<any> = await apiClient(`${baseUrl}/config`, "PUT", dto);
        return { success: true, message: response.message || "Tárhely beállítások sikeresen mentve." };
    };

    testConnection = async (dto: StorageTestRequestDto): Promise<StorageTestResponseDto> => {
        const response: ApiResponse<StorageTestResponseDto> = await apiClient(`${baseUrl}/test`, "POST", dto);
        return response.data!;
    };
}
