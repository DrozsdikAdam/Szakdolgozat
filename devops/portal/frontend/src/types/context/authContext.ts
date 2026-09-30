export interface AuthState {
    isAuthenticated: boolean;
    username: string | null;
    token: string | null;
    isLoading: boolean;
}

export interface AuthContextType extends AuthState {
    setSession: (username: string, token: string) => void;
    logout: () => void;
}
