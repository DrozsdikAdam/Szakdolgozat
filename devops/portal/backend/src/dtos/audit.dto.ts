import type { AuditAction, AuditStatus } from "../types/Audit.types.js"

export interface AuditResponseDto {
    id: string
    action: AuditAction
    details: string
    status: AuditStatus
    createdAt: string
}