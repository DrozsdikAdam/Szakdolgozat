import type { UserResponse, UserRole, UserStatus } from "./User";

export interface UserStatCardProps {
    users: UserResponse[]
}

export interface UserFilterBarProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
    roleFilter: UserRole | "ALL",
    setRoleFilter: (filter: UserRole | "ALL") => void,
    statusFilter: UserStatus | "ALL",
    setStatusFilter: (filter: UserStatus | "ALL") => void,
    openCreateModal: () => void
}

export interface UserCardProps {
    user: UserResponse,
    onEdit: (user: UserResponse) => void,
    onPromote: (user: UserResponse) => void,
    onToggleStatus: (user: UserResponse) => void
}

export interface UserPromoteModalProps {
    isOpen: boolean,
    closeModal: () => void,
    user: UserResponse | null,
    onSuccess: () => void
}

export interface UserEditModalProps {
    isOpen: boolean,
    closeModal: () => void,
    user: UserResponse | null,
    onSuccess: () => void
}

export interface UserCreateModalProps {
    isOpen: boolean,
    closeModal: () => void,
    onSuccess: () => void
}

export interface UserRoleBadgeProps {
    role: UserRole
}

export interface UserStatusBadgeProps {
    status: UserStatus
}
