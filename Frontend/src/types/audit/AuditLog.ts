export type AuditAction = "CREATE"
    | "UPDATE"
    | "DELETE"
    | "STATUS_CHANGE"
    | "EMERGENCY_STOP"
    | "LOGIN"
    | "LOGOUT"
    | "STOCK_ADJUSTMENT"
    | "STOCK_RESERVED"
    | "STOCK_CONSUMED"
    | "MAINTENANCE_LOG";

export type AuditEntityType = "USER"
    | "MACHINE"
    | "WORKORDER"
    | "MAINTENANCE"
    | "INVENTORY"
    | "PRODUCT"
    | "BOM"
    | "AUTHENTICATION";

export interface AuditLogResponse {
    id: string;
    username: string,
    userId?: string,
    action: AuditAction,
    entityType: AuditEntityType,
    entityId?: string,
    details: string,
    ipAddress?: string,
    timestamp: string
}