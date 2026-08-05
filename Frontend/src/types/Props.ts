import type { ReactNode } from "react";

export interface Props {
    children: ReactNode;
    allowedRoles?: string[];
}

export interface TitleProps {
    page: "inventory" | "product" | "bom" | "workorder"
}