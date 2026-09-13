import type { AuditResponseDto } from "../../audit";

export interface auditTableProps {
    logs: AuditResponseDto[]
    loading: boolean
    searchQuery?: string
}