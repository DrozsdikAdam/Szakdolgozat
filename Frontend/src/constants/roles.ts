import type { UserRole } from "../types/user/User";

export interface RoleDefinition {
    key: UserRole,
    label: "Rendszergazda" | "Vezérigazgató" | "Menedzser" | "Operátor" | "Technikus",
    badgeStyle: string,
    level: number
}

export const ROLES: Record<UserRole, RoleDefinition> = {
    SYSTEMADMIN: {
        key: "SYSTEMADMIN",
        label: "Rendszergazda",
        badgeStyle: "badge-danger",
        level: 4
    },
    CEO: {
        key: "CEO",
        label: "Vezérigazgató",
        badgeStyle: "badge-purple",
        level: 3
    },
    MANAGER: {
        key: "MANAGER",
        label: "Menedzser",
        badgeStyle: "badge-warning",
        level: 2
    },
    OPERATOR: {
        key: "OPERATOR",
        label: "Operátor",
        badgeStyle: "badge-blue",
        level: 1
    },
    TECHNICIAN: {
        key: "TECHNICIAN",
        label: "Technikus",
        badgeStyle: "badge-info",
        level: 2
    }
}

export const ROLE_OPTIONS: RoleDefinition[] = Object.values(ROLES)

export const getRoleLabel = (role?: UserRole) => role ? ROLES[role]?.label ?? "Ismeretlen" : "Ismeretlen";

export const getRoleBadgeStyle = (role?: UserRole) => role ? ROLES[role]?.badgeStyle ?? "badge-neutral" : "badge-neutral";