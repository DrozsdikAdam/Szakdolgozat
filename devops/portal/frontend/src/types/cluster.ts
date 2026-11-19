export type ClusterViewMode = "pods" | "events" | "logs";

export type PodSourceFilter = "all" | "app" | "platform";

export interface ClusterOverviewTabProps {
    initialView?: ClusterViewMode;
}
