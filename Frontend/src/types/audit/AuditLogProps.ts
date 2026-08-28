import type { AuditAction, AuditEntityType, AuditLogResponse } from "./AuditLog";

export interface AuditFilterBarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    selectedEntity: AuditEntityType | "ALL";
    setSelectedEntity: (value: AuditEntityType | "ALL") => void;
    selectedAction: AuditAction | "ALL";
    setSelectedAction: (value: AuditAction | "ALL") => void;
}

export interface AuditTableProps {
    logs: AuditLogResponse[];
}

export interface AuditEntityTypeBadgeProps {
    type: AuditEntityType;
}

export interface AuditActionBadgeProps {
    action: AuditAction;
}