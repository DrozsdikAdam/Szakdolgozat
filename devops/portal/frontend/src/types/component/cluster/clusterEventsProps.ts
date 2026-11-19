import type { K8sEventDto } from "../../k8s";

export interface ClusterEventsProps {
    events: K8sEventDto[];
    loading: boolean;
    onRefresh: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}
