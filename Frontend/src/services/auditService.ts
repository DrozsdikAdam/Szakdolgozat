import type { AuditAction, AuditEntityType, AuditLogResponse } from "../types/audit/AuditLog";
import { apiFetch } from "../utils/apiFetch";
import type { PagedResponse } from "../types/common/PagedResponse";

const baseUrl = "/api/audit"

export const getLogs = async (page: number = 0, size: number = 20, entityType?: AuditEntityType | "ALL", action?: AuditAction | "ALL"): Promise<PagedResponse<AuditLogResponse>> => {
    const params = new URLSearchParams();
    if (entityType && entityType !== "ALL") params.append("entityType", entityType);
    if (action && action !== "ALL") params.append("action", action);
    params.append("page", page.toString());
    params.append("size", size.toString());
    const response: PagedResponse<AuditLogResponse> = await apiFetch(`${baseUrl}?${params.toString()}`)
    return response;
}