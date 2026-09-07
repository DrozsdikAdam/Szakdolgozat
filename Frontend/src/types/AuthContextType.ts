import type { UserResponse } from "./user/User";

export interface AuthContextType {
    user: UserResponse | null,
    loading: boolean,
    error: string | null,
    login: (username: string, password: string) => Promise<void>,
    logout: () => Promise<void>,
    checkSession: () => Promise<void>
}