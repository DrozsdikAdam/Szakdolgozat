import type { User } from "./User";

export interface AuthContextType {
    user: User | null,
    loading: boolean,
    error: string | null,
    login: (username: string, password: string) => Promise<void>,
    logout: () => Promise<void>
}