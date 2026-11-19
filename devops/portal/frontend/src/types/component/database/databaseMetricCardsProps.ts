import type { DatabaseOverviewDto } from "../../database";

export interface DatabaseMetricCardsProps {
    overview: DatabaseOverviewDto | null;
    isLoading: boolean;
}
