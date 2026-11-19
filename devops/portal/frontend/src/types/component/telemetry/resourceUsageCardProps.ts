import type { ReactNode } from "react";
import type { BadgeProps } from "../badgeProps";

export interface ResourceUsageCardProps {
    title: string;
    icon: ReactNode;
    iconBoxClassName?: string;
    usage: number;
    limit: number;
    requests: number;
    usagePercent: number;
    unit: string;
    badgeText?: string;
    badgeVariant?: BadgeProps['variant'];
    isLoading?: boolean;
}
