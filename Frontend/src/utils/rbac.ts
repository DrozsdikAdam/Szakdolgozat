import type { User, UserRole } from "../types/user/User";

export const hasAnyRole = (user: User | null, allowedRoles: UserRole[]): boolean => {
    if (!user || !allowedRoles || allowedRoles.length === 0)
        return false;

    return allowedRoles.some(role => user.roles?.includes(role));
}