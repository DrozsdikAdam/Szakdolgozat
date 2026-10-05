import type { ApiResponse } from "../../types/api";
import type {
    DatabaseOverviewDto,
    TestConnectionDto,
    TestConnectionResultDto,
    ScaleDatabaseDto,
    ScaleDatabaseResult,
    SaveDatabaseConfigDto,
    SaveDatabaseConfigResult,
    StartMigrationDto,
    MigrationJobStatusDto,
    ScheduleCutoverDto,
    CutoverStatusDto
} from "../../types/database";
import { apiClient } from "../apiClient";

const baseUrl = '/api/database';

export class DatabaseApi {
    getOverview = async (): Promise<DatabaseOverviewDto> => {
        const response: ApiResponse<DatabaseOverviewDto> = await apiClient(`${baseUrl}/overview`, "GET");
        return response.data!;
    };

    testConnection = async (dto: TestConnectionDto): Promise<TestConnectionResultDto> => {
        const response: ApiResponse<TestConnectionResultDto> = await apiClient(`${baseUrl}/test`, "POST", dto);
        return response.data!;
    };

    scaleDatabase = async (dto: ScaleDatabaseDto): Promise<ScaleDatabaseResult> => {
        const response: ApiResponse<ScaleDatabaseResult> = await apiClient(`${baseUrl}/scale`, "POST", dto);
        return response.data!;
    };

    saveConfig = async (dto: SaveDatabaseConfigDto): Promise<SaveDatabaseConfigResult> => {
        const response: ApiResponse<SaveDatabaseConfigResult> = await apiClient(`${baseUrl}/config`, "PUT", dto);
        return response.data!;
    };

    startMigration = async (dto: StartMigrationDto): Promise<MigrationJobStatusDto> => {
        const response: ApiResponse<MigrationJobStatusDto> = await apiClient(`${baseUrl}/migrate`, "POST", dto);
        return response.data!;
    };

    getMigrationStatus = async (jobId: string): Promise<MigrationJobStatusDto> => {
        const response: ApiResponse<MigrationJobStatusDto> = await apiClient(`${baseUrl}/migration-status/${jobId}`, "GET");
        return response.data!;
    };

    scheduleCutover = async (dto: ScheduleCutoverDto): Promise<CutoverStatusDto> => {
        const response: ApiResponse<CutoverStatusDto> = await apiClient(`${baseUrl}/cutover/schedule`, "POST", dto);
        return response.data!;
    };

    getCutoverStatus = async (): Promise<CutoverStatusDto> => {
        const response: ApiResponse<CutoverStatusDto> = await apiClient(`${baseUrl}/cutover/status`, "GET");
        return response.data!;
    };

    cancelCutover = async (): Promise<CutoverStatusDto> => {
        const response: ApiResponse<CutoverStatusDto> = await apiClient(`${baseUrl}/cutover/cancel`, "POST");
        return response.data!;
    };
}
