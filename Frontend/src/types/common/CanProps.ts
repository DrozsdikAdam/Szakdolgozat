import type { ReactNode } from "react";
import type { UserRole } from "../user/User";

export interface CanProps {
    roles: UserRole[],
    children: ReactNode,
    fallback?: ReactNode | null
}