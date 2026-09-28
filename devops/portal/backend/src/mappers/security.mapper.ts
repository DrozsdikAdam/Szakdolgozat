import type {
    VulnerabilityItem,
    VulnerabilitySummary,
    TlsCertificateStatus,
    SecretComplianceItem,
    SeverityType
} from "../types/security.types.js";
import { SECURITY_SCORE_WEIGHTS } from "../constants/security.constants.js";

export class SecurityMapper {
    public static fromTrivyReport(data: any, source: string): VulnerabilityItem[] {
        const items: VulnerabilityItem[] = [];
        if (!data || !Array.isArray(data.Results)) {
            return items;
        }

        for (const res of data.Results) {
            const vulnerabilities = res?.Vulnerabilities;
            if (!Array.isArray(vulnerabilities)) {
                continue;
            }

            for (const vuln of vulnerabilities) {
                const rawSeverity = (vuln?.Severity || "LOW").toUpperCase();
                let severity: SeverityType = "LOW";
                if (rawSeverity === "CRITICAL" || rawSeverity === "HIGH" || rawSeverity === "MEDIUM") {
                    severity = rawSeverity;
                }

                items.push({
                    cveId: vuln?.VulnerabilityID || "UNKNOWN-CVE",
                    packageName: vuln?.PkgName || "unknown-package",
                    packageVersion: vuln?.InstalledVersion || "0.0.0",
                    fixedVersion: vuln?.FixedVersion || undefined,
                    severity,
                    source,
                    description: vuln?.Title || vuln?.Description || "Nincs leírás",
                    url: vuln?.PrimaryURL || undefined
                });
            }
        }

        return items;
    }

    public static fromNpmAuditReport(data: any, source: string): VulnerabilityItem[] {
        const items: VulnerabilityItem[] = [];
        if (!data) return items;

        if (data.vulnerabilities && typeof data.vulnerabilities === "object") {
            for (const [pkgName, vulnObj] of Object.entries<any>(data.vulnerabilities)) {
                if (!vulnObj) continue;

                const rawSeverity = (vulnObj.severity || "low").toLowerCase();
                let severity: SeverityType = "LOW";
                if (rawSeverity === "critical") severity = "CRITICAL";
                else if (rawSeverity === "high") severity = "HIGH";
                else if (rawSeverity === "moderate" || rawSeverity === "medium") severity = "MEDIUM";

                let fixedVersion: string | undefined;
                if (vulnObj.fixAvailable) {
                    if (typeof vulnObj.fixAvailable === "object" && vulnObj.fixAvailable.version) {
                        fixedVersion = vulnObj.fixAvailable.version;
                    }
                }

                if (Array.isArray(vulnObj.via)) {
                    for (const viaItem of vulnObj.via) {
                        if (typeof viaItem === "object" && viaItem !== null) {
                            items.push({
                                cveId: viaItem.url ? viaItem.url.split("/").pop() || viaItem.name : `GHSA-${pkgName}`,
                                packageName: viaItem.name || pkgName,
                                packageVersion: vulnObj.range || "ismeretlen",
                                fixedVersion,
                                severity,
                                source,
                                description: viaItem.title || `${pkgName} sebezhetőség`,
                                url: viaItem.url
                            });
                        }
                    }
                } else {
                    items.push({
                        cveId: `GHSA-${pkgName}`,
                        packageName: pkgName,
                        packageVersion: vulnObj.range || "ismeretlen",
                        fixedVersion,
                        severity,
                        source,
                        description: `${pkgName} sebezhetőség npm csomagban.`
                    });
                }
            }
        }

        if (items.length === 0 && data.advisories && typeof data.advisories === "object") {
            for (const advisory of Object.values<any>(data.advisories)) {
                if (!advisory) continue;

                const rawSeverity = (advisory.severity || "low").toLowerCase();
                let severity: SeverityType = "LOW";
                if (rawSeverity === "critical") severity = "CRITICAL";
                else if (rawSeverity === "high") severity = "HIGH";
                else if (rawSeverity === "moderate" || rawSeverity === "medium") severity = "MEDIUM";

                const cve = Array.isArray(advisory.cves) && advisory.cves.length > 0
                    ? advisory.cves[0]
                    : `GHSA-${advisory.id || advisory.module_name}`;

                items.push({
                    cveId: cve,
                    packageName: advisory.module_name || "unknown",
                    packageVersion: advisory.findings?.[0]?.version || advisory.vulnerable_versions || "0.0.0",
                    fixedVersion: advisory.patched_versions || undefined,
                    severity,
                    source,
                    description: advisory.title || advisory.overview || "Nincs leírás",
                    url: advisory.url
                });
            }
        }

        return items;
    }

    public static toVulnerabilitySummary(items: VulnerabilityItem[]): VulnerabilitySummary {
        let critical = 0;
        let high = 0;
        let medium = 0;
        let low = 0;
        let fixable = 0;

        for (const item of items) {
            switch (item.severity) {
                case "CRITICAL":
                    critical++;
                    break;
                case "HIGH":
                    high++;
                    break;
                case "MEDIUM":
                    medium++;
                    break;
                case "LOW":
                    low++;
                    break;
            }
            if (item.fixedVersion && item.fixedVersion.trim().length > 0) {
                fixable++;
            }
        }

        return {
            critical,
            high,
            medium,
            low,
            fixable,
            total: items.length
        };
    }

    public static calculateSecurityScore(
        summary: VulnerabilitySummary,
        certs: TlsCertificateStatus[],
        secrets: SecretComplianceItem[]
    ): number {
        let score = 100;

        score -= summary.critical * SECURITY_SCORE_WEIGHTS.VULNERABILITY.CRITICAL;
        score -= summary.high * SECURITY_SCORE_WEIGHTS.VULNERABILITY.HIGH;
        score -= summary.medium * SECURITY_SCORE_WEIGHTS.VULNERABILITY.MEDIUM;
        score -= summary.low * SECURITY_SCORE_WEIGHTS.VULNERABILITY.LOW;

        for (const cert of certs) {
            if (cert.state === "EXPIRED") {
                score -= SECURITY_SCORE_WEIGHTS.TLS.EXPIRED;
            } else if (cert.state === "EXPIRING_SOON") {
                score -= SECURITY_SCORE_WEIGHTS.TLS.EXPIRING_SOON;
            }
        }

        for (const sec of secrets) {
            if (sec.rotationState === "CRITICAL_OVERDUE") {
                score -= SECURITY_SCORE_WEIGHTS.SECRET.CRITICAL_OVERDUE;
            } else if (sec.rotationState === "ROTATION_DUE") {
                score -= SECURITY_SCORE_WEIGHTS.SECRET.ROTATION_DUE;
            }
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    public static scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
        if (score >= 90) return "A";
        if (score >= 75) return "B";
        if (score >= 60) return "C";
        if (score >= 40) return "D";
        return "F";
    }
}
