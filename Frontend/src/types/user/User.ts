export interface User {
    id: string,
    username: string,
    roles: string[]
}

export interface UserResponse {
    id: string,
    username: string,
    email: string,
    phoneNumber: string | null,
    active: boolean,
    roles: string[]
}

export interface UserCreateRequest {
    username: string,
    email: string,
    password: string,
    phoneNumber: string,
    roles: string[]
}

export interface UserUpdateRequest {
    username: string,
    email: string,
    phoneNumber: string,
    roles: string[],
    active: boolean
}

export interface UserPromoteRequest {
    roles: string[]
}