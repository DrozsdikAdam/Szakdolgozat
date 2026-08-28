import type { AuditEntityType, AuditLogResponse } from "../types/audit/AuditLog";
import { apiFetch } from "../utils/apiFetch";

const baseUrl = "/api/audit"

export const getAllLogs = async (): Promise<AuditLogResponse[]> => {
    const response: AuditLogResponse[] = await apiFetch(`${baseUrl}`)
    return response;
}

export const getRecentLogs = async (): Promise<AuditLogResponse[]> => {
    const response: AuditLogResponse[] = await apiFetch(`${baseUrl}/recent`)
    return response;
}

export const getLogsByEntityType = async (entityType: AuditEntityType): Promise<AuditLogResponse[]> => {
    const response: AuditLogResponse[] = await apiFetch(`${baseUrl}/entity/${entityType}`)
    return response;
}