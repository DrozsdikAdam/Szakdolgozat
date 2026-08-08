import type { UserResponse } from "./User";

export interface UserStatCardProps {
    users: UserResponse[]
}

export interface UserFilterBarProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
    roleFilter: string,
    setRoleFilter: (filter: string) => void,
    statusFilter: string,
    setStatusFilter: (filter: string) => void,
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