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