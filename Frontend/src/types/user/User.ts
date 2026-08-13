export interface User {
    id: string,
    username: string,
    roles: UserRole[]
}

export interface UserResponse {
    id: string,
    username: string,
    email: string,
    phoneNumber: string | null,
    active: boolean,
    roles: UserRole[]
}

export interface UserCreateRequest {
    username: string,
    email: string,
    password: string,
    phoneNumber: string,
    roles: UserRole[]
}

export interface UserUpdateRequest {
    username: string,
    email: string,
    phoneNumber: string,
    roles: UserRole[],
    active: boolean
}

export interface UserPromoteRequest {
    roles: UserRole[]
}

export type UserRole = "SYSTEMADMIN" | "CEO" | "MANAGER" | "OPERATOR"

export type UserStatus = "ACTIVE" | "INACTIVE"