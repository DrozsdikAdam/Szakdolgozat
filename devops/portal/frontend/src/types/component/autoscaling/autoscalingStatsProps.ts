import type { UpdateHpaDto, VpaOverviewDto } from "../../k8s";

export interface AutoscalingStatsProps {
    hpa: UpdateHpaDto | null;
    vpa: VpaOverviewDto | null;
    isLoading?: boolean;
}