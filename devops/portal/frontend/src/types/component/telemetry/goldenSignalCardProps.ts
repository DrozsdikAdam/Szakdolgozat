import type { ReactNode } from "react";

export interface GoldenSignalCardProps {
    title: string;
    icon: ReactNode;
    iconBoxClassName?: string;
    value?: string | number;
    unit?: string;
    footer?: ReactNode;
    children?: ReactNode;
    isLoading?: boolean;
}
