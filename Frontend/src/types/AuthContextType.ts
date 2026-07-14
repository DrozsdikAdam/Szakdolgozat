import type { User } from "../types/User";

export interface AuthContextType {
    user: User | null,
    loading: boolean,
    error: string | null,
    login: (username: string, password: string) => Promise<void>,
    logout: () => Promise<void>
}