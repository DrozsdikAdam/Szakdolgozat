import type { UserStatus } from "../types/user/User";

export interface UserStatusDefinition {
    key: UserStatus,
    label: "Aktív" | "Inaktív",
    badgeStyle: string
}

export const USER_STATUSES: Record<UserStatus, UserStatusDefinition> = {
    ACTIVE: {
        key: "ACTIVE",
        label: "Aktív",
        badgeStyle: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    },
    INACTIVE: {
        key: "INACTIVE",
        label: "Inaktív",
        badgeStyle: "bg-red-500/10 border-red-500/20 text-red-400"
    }
}

export const USER_STATUS_OPTIONS: UserStatusDefinition[] = Object.values(USER_STATUSES)

export const getUserStatusLabel = (status?: UserStatus) => status ? USER_STATUSES[status].label : "Ismeretlen";

export const getUserStatusBadgeStyle = (status?: UserStatus) => status ? USER_STATUSES[status].badgeStyle : "bg-slate-800 border-slate-700 text-slate-300";