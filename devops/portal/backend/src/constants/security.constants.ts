import type {
    VulnerabilityItem,
    TlsCertificateStatus,
    SecretComplianceItem
} from "../types/security.types.js";

export const SECURITY_SCORE_WEIGHTS = {
    VULNERABILITY: {
        CRITICAL: 15,
        HIGH: 6,
        MEDIUM: 2,
        LOW: 0.5
    },
    TLS: {
        EXPIRED: 25,
        EXPIRING_SOON: 10
    },
    SECRET: {
        CRITICAL_OVERDUE: 15,
        ROTATION_DUE: 5
    }
} as const;

export const BASELINE_VULNERABILITIES: VulnerabilityItem[] = [
    {
        cveId: "CVE-2024-22243",
        packageName: "org.springframework:spring-web",
        packageVersion: "6.1.3",
        fixedVersion: "6.1.4",
        severity: "HIGH",
        source: "backend-container",
        description: "Spring Web UriComponentsBuilder URL parsing parsing vulnerability leading to open redirect or SSRF.",
        url: "https://nvd.nist.gov/vuln/detail/CVE-2024-22243"
    },

    {
        cveId: "CVE-2023-45853",
        packageName: "zlib",
        packageVersion: "1.2.13-r0",
        fixedVersion: "1.3-r0",
        severity: "MEDIUM",
        source: "backend-container",
        description: "MiniZip in zlib allows integer overflow in zipOpenNewFileInZip4_64.",
        url: "https://nvd.nist.gov/vuln/detail/CVE-2023-45853"
    },
    {
        cveId: "CVE-2024-28849",
        packageName: "follow-redirects",
        packageVersion: "1.15.4",
        fixedVersion: "1.15.6",
        severity: "HIGH",
        source: "frontend-npm",
        description: "Leakage of Proxy-Authorization header during cross-origin redirect in HTTP client.",
        url: "https://nvd.nist.gov/vuln/detail/CVE-2024-28849"
    },
    {
        cveId: "CVE-2023-45133",
        packageName: "babel-traverse",
        packageVersion: "7.23.0",
        fixedVersion: "7.23.2",
        severity: "MEDIUM",
        source: "frontend-npm",
        description: "Arbitrary code execution when compiling untrusted user code with Babel.",
        url: "https://nvd.nist.gov/vuln/detail/CVE-2023-45133"
    },
    {
        cveId: "CVE-2024-12345",
        packageName: "tar",
        packageVersion: "6.1.11",
        fixedVersion: "6.2.1",
        severity: "LOW",
        source: "frontend-npm",
        description: "Denial of service through excessive memory consumption in tar unpacker.",
        url: "https://nvd.nist.gov/vuln/detail/CVE-2024-12345"
    }
];

export const FALLBACK_TLS_CERTIFICATES: TlsCertificateStatus[] = [
    {
        name: "mes.localhost",
        k8sSecret: "mes-tls-secret",
        issuer: "CN=mes.localhost, O=MES Platform Authority",
        daysRemaining: 364,
        state: "VALID",
        validTo: new Date(Date.now() + 364 * 86400000).toISOString().split("T")[0]
    },
    {
        name: "portal.localhost",
        k8sSecret: "paas-portal-tls",
        issuer: "Let's Encrypt Authority X3",
        daysRemaining: 21,
        state: "EXPIRING_SOON",
        validTo: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0]
    }
];

export const FALLBACK_SECRET_COMPLIANCE: SecretComplianceItem[] = [
    {
        name: "paas-portal-auth",
        namespace: "platform-infra",
        type: "Opaque",
        ageDays: 12,
        lastModified: new Date(Date.now() - 12 * 86400000).toISOString().split("T")[0],
        rotationState: "COMPLIANT"
    },
    {
        name: "mes-tls-secret",
        namespace: "app-mes",
        type: "kubernetes.io/tls",
        ageDays: 35,
        lastModified: new Date(Date.now() - 35 * 86400000).toISOString().split("T")[0],
        rotationState: "COMPLIANT"
    },
    {
        name: "backend-db-secret",
        namespace: "platform-infra",
        type: "Opaque",
        ageDays: 78,
        lastModified: new Date(Date.now() - 78 * 86400000).toISOString().split("T")[0],
        rotationState: "ROTATION_DUE"
    },
    {
        name: "legacy-api-token",
        namespace: "app-mes",
        type: "Opaque",
        ageDays: 112,
        lastModified: new Date(Date.now() - 112 * 86400000).toISOString().split("T")[0],
        rotationState: "CRITICAL_OVERDUE"
    }
];
