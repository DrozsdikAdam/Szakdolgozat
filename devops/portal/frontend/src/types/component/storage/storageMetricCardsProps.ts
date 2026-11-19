import type { StorageOverViewDto } from "../../storage";

export interface StorageMetricCardsProps {
    overview: StorageOverViewDto | null;
    isLoading: boolean;
}
