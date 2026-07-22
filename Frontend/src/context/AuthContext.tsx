import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "../utils/apiFetch";
import type { User } from "../types/User";
import type { AuthContextType } from "../types/AuthContextType";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const checkSession = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response: User = await apiFetch("/api/auth/me");
            setUser(response);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const response: User = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password })
            })
            setUser(response);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setError(message);
            setUser(null);
            throw message;
        } finally {
            setLoading(false)
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await apiFetch("/api/auth/logout", {
                method: "POST"
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setError(message);
            throw message;
        } finally {
            setUser(null);
            setLoading(false);
            setError(null);
        }
    }, []);

    const values = { user, loading, error, login, logout }

    useEffect(() => {
        checkSession();
    }, [])

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    )
}

