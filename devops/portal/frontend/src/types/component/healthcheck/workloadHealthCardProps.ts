import type { WorkloadHealthDto } from "../../healthcheck";

export interface WorkloadHealthCardProps {
    workload: WorkloadHealthDto
    onEdit: (workload: WorkloadHealthDto) => void
    onTest: (workload: WorkloadHealthDto) => Promise<void>
    isTesting?: boolean
}