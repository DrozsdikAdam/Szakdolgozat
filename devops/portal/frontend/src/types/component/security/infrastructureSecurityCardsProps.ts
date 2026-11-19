import type { SecretComplianceItem, TlsCertificateStatus } from "../../security"

export interface InfrastructureSecurityCardsProps {
    tlsCertificates: TlsCertificateStatus[]
    secretCompliance: SecretComplianceItem[]
    isLoading?: boolean
}