import type { Props } from "../types/Props";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && allowedRoles.length > 0 && !user.roles.some(role => allowedRoles.includes(role))) {
        return <Navigate to="/unauthorized" state={{ from: location }} replace />
    }

    return children;
}