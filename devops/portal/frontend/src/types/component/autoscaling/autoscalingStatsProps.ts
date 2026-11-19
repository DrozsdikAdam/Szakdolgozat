import type { UpdateHpaDto, VpaOverviewDto } from "../../k8s";

export interface AutoscalingStatsProps {
    strategy: 'hpa' | 'vpa';
    hpa: UpdateHpaDto | null;
    vpa: VpaOverviewDto | null;
    isLoading?: boolean;
}