import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = () => {
    const auth = useAuth();
    const location = useLocation();

    if (auth.isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 text-cud-skyblue animate-spin" />
                <span className="text-xs text-slate-400 font-medium">
                    Hitelesítési munkamenet ellenőrzése...
                </span>
            </div>
        );
    }

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
