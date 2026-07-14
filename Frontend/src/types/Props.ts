import type { ReactNode } from "react";

export interface Props {
    children: ReactNode;
    allowedRoles?: string[];
}