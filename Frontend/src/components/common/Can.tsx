import { useAuth } from "../../hooks/UseAuth";
import type { CanProps } from "../../types/common/CanProps";
import { hasAnyRole } from "../../utils/rbac";

export const Can = ({ roles, children, fallback }: CanProps) => {
    const user = useAuth().user;

    if (hasAnyRole(user, roles)) return children;

    if (fallback) return fallback;

    return null;
}