import type { ApiResponse } from "../../types/api";
import type { SecurityOverviewDto, VulnerabilityItem, TlsCertificateStatus, SecretComplianceItem, SeverityType, LoginRequest, LoginResponse } from "../../types/security";
import { apiClient } from "../apiClient";

const BaseUrl = "/api/security";

export class SecurityApi {
    getOverview = async (): Promise<SecurityOverviewDto> => {
        const response: ApiResponse<SecurityOverviewDto> = await apiClient(`${BaseUrl}/overview`, "GET");
        return response.data!;
    };

    getVulnerabilities = async (severity?: SeverityType, component?: string): Promise<VulnerabilityItem[]> => {
        const params = new URLSearchParams();
        if (severity) params.append("severity", severity);
        if (component) params.append("component", component);
        const query = params.toString() ? `?${params.toString()}` : "";

        const response: ApiResponse<VulnerabilityItem[]> = await apiClient(`${BaseUrl}/vulnerabilities${query}`, "GET");
        return response.data!;
    };

    getTlsCertificates = async (): Promise<TlsCertificateStatus[]> => {
        const response: ApiResponse<TlsCertificateStatus[]> = await apiClient(`${BaseUrl}/tls`, "GET");
        return response.data!;
    };

    getSecretCompliance = async (): Promise<SecretComplianceItem[]> => {
        const response: ApiResponse<SecretComplianceItem[]> = await apiClient(`${BaseUrl}/secrets`, "GET");
        return response.data!;
    };

    login = async (dto: LoginRequest): Promise<LoginResponse> => {
        const response: ApiResponse<LoginResponse> = await apiClient(`${BaseUrl}/login`, "POST", dto);
        return response.data!;
    };

    rotatePassword = async (newPassword: string): Promise<{ message: string; rotatedAt: string }> => {
        const response: ApiResponse<{ message: string; rotatedAt: string }> = await apiClient(
            `${BaseUrl}/rotate-password`,
            "POST",
            { newPassword }
        );
        return response.data!;
    };
}
