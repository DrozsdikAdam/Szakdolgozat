import type { ApiResponse } from "../../types/api";
import type { FeatureTogglePayload, PlatformStatusResponse, SetupWizardPayload } from "../../types/platform";
import { apiClient } from "../apiClient";

export class PlatformApi {
    getStatus = async (): Promise<PlatformStatusResponse> => {
        const response: ApiResponse<PlatformStatusResponse> = await apiClient("/api/platform/status", "GET");
        return response.data!;
    }

    setup = async (request: SetupWizardPayload): Promise<void> => {
        await apiClient("/api/platform/setup", "POST", request);
    }

    toggleFeature = async (request: FeatureTogglePayload): Promise<void> => {
        await apiClient("/api/platform/features/toggle", "POST", request);
    }
}