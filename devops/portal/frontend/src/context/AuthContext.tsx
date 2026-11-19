import { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { AuthContextType, AuthState } from "../types/context/authContext";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../constants/auth";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        username: null,
        token: null,
        isLoading: true,
    });

    useEffect(() => {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = localStorage.getItem(AUTH_USER_KEY);

        if (storedToken && storedUser) {
            setState({
                isAuthenticated: true,
                username: storedUser,
                token: storedToken,
                isLoading: false,
            });
            return;
        }

        setState((prev) => ({ ...prev, isLoading: false }));
    }, []);

    const setSession = useCallback((username: string, token: string) => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, username);
        setState({
            isAuthenticated: true,
            username,
            token,
            isLoading: false,
        });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setState({
            isAuthenticated: false,
            username: null,
            token: null,
            isLoading: false,
        });
    }, []);

    const value: AuthContextType = useMemo(
        () => ({
            ...state,
            setSession,
            logout,
        }),
        [state, setSession, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
