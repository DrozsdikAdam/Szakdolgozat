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
        badgeStyle: "badge-success"
    },
    INACTIVE: {
        key: "INACTIVE",
        label: "Inaktív",
        badgeStyle: "badge-danger"
    }
}

export const USER_STATUS_OPTIONS: UserStatusDefinition[] = Object.values(USER_STATUSES)

export const getUserStatusLabel = (status?: UserStatus) => status ? USER_STATUSES[status]?.label ?? "Ismeretlen" : "Ismeretlen";

export const getUserStatusBadgeStyle = (status?: UserStatus) => status ? USER_STATUSES[status]?.badgeStyle ?? "badge-neutral" : "badge-neutral";