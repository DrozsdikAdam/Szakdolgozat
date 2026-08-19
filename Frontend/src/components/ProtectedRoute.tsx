import type { Props } from "../types/Props";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/UseAuth";
import { LoadingSpinner } from "./common/LoadingSpinner";

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && allowedRoles.length > 0 && (!user.roles || !user.roles.some(role => allowedRoles.includes(role)))) {
        return <Navigate to="/unauthorized" state={{ from: location }} replace />
    }

    return children;
}