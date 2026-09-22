import type { WorkloadMetricDto } from "../../telemetry";

export interface WorkloadTelemetryTableProps {
    workloads: WorkloadMetricDto[]
    selectedNamespace?: string
    onNamespaceChange?: (namespace: string) => void
    isLoading?: boolean
}