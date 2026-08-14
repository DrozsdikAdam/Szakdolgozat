import type { UserRole } from "../types/user/User";
import { useAuth } from "./UseAuth";


export const usePermission = () => {
    const { user } = useAuth();

    const hasRole = (role: UserRole): boolean => {
        if (!role || !user) return false;
        return user.roles.includes(role)
    }

    const hasAnyRole = (roles: UserRole[]): boolean => {
        if (!roles || !user) return false;
        return roles.some((role) => hasRole(role))
    }

    const hasAllRoles = (roles: UserRole[]): boolean => {
        if (!roles || !user) return false;
        return roles.every((role) => hasRole(role))
    }

    return {
        hasRole, hasAnyRole, hasAllRoles,
        isAdmin: hasAnyRole(["SYSTEMADMIN", "CEO"]),
        isManager: hasRole("MANAGER"),
        isOperator: hasRole("OPERATOR"),
        roles: user?.roles || []
    }
}