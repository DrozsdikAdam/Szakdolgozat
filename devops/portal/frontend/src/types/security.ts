export type SeverityType = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type DynamicStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

export type RotationStatus = "COMPLIANT" | "ROTATION_DUE" | "CRITICAL_OVERDUE";

export type ScoreGrade = "A" | "B" | "C" | "D" | "F";

export interface VulnerabilityItem {
    cveId: string;
    packageName: string;
    packageVersion: string;
    fixedVersion?: string | undefined;
    severity: SeverityType;
    source: string;
    description: string;
    url?: string | undefined;
}

export interface VulnerabilitySummary {
    critical: number;
    high: number;
    medium: number;
    low: number;
    fixable: number;
    total: number;
}

export interface TlsCertificateStatus {
    name: string;
    k8sSecret: string;
    issuer: string;
    daysRemaining: number;
    state: DynamicStatus;
    validTo?: string | undefined;
}

export interface SecretComplianceItem {
    name: string;
    namespace: string;
    type: string;
    ageDays: number;
    lastModified?: string | undefined;
    rotationState: RotationStatus;
}

export interface RotatePasswordRequest {
    newPassword: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    username: string;
    token?: string | undefined;
    message: string;
}

export interface SecurityOverviewDto {
    overallScore: number;
    scoreGrade: ScoreGrade;
    lastScanDate: string;
    vulnerabilities: {
        summary: VulnerabilitySummary;
        items: VulnerabilityItem[];
    };
    tlsCertificates: TlsCertificateStatus[];
    secretCompliance: SecretComplianceItem[];
}
