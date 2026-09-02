import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/UseAuth"
import { LoadingSpinner } from "./common/LoadingSpinner"

export const HomeRedirect = () => {
    const { user, loading } = useAuth()

    if (loading) {
        return <LoadingSpinner />
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Ha csak technikus szerepköre van, a karbantartási oldal az alapértelmezett kezdőlap
    if (user.roles?.includes("TECHNICIAN") && !user.roles?.some(r => ["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR"].includes(r))) {
        return <Navigate to="/maintenance" replace />
    }

    return <Navigate to="/product" replace />
}
