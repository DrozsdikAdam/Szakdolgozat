import type {
    VulnerabilityItem,
    VulnerabilitySummary,
    TlsCertificateStatus,
    SecretComplianceItem,
    LoginRequest,
    LoginResponse
} from "../types/security.types.js";

export interface SecurityOverviewDto {
    overallScore: number;
    scoreGrade: "A" | "B" | "C" | "D" | "F";
    lastScanDate: string;
    vulnerabilities: {
        summary: VulnerabilitySummary;
        items: VulnerabilityItem[];
    };
    tlsCertificates: TlsCertificateStatus[];
    secretCompliance: SecretComplianceItem[];
}

export type LoginRequestDto = LoginRequest;
export type LoginResponseDto = LoginResponse;