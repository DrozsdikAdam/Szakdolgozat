import type { UserRole } from "../types/user/User";

export interface RoleDefinition {
    key: UserRole,
    label: "Rendszergazda" | "Vezérigazgató" | "Menedzser" | "Operátor",
    badgeStyle: string,
    level: number
}

export const ROLES: Record<UserRole, RoleDefinition> = {
    SYSTEMADMIN: {
        key: "SYSTEMADMIN",
        label: "Rendszergazda",
        badgeStyle: "bg-red-500/10 border-red-500/20 text-red-400",
        level: 4
    },
    CEO: {
        key: "CEO",
        label: "Vezérigazgató",
        badgeStyle: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        level: 3
    },
    MANAGER: {
        key: "MANAGER",
        label: "Menedzser",
        badgeStyle: "bg-orange-500/10 border-orange-500/20 text-orange-400",
        level: 2
    },
    OPERATOR: {
        key: "OPERATOR",
        label: "Operátor",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        level: 1
    }
}

export const ROLE_OPTIONS: RoleDefinition[] = Object.values(ROLES)

export const getRoleLabel = (role?: UserRole) => role ? ROLES[role].label : "Ismeretlen";

export const getRoleBadgeStyle = (role?: UserRole) => role ? ROLES[role].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";