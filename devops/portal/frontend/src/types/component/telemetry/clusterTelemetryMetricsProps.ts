import type { ClusterResourceMetricsDto } from "../../telemetry";

export interface ClusterTelemetryMetricsProps {
    cluster: ClusterResourceMetricsDto
    isLoading?: boolean
}