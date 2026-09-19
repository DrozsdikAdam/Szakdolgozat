import type { WorkloadDeploymentDto } from "../../deployments";

export interface WorkloadDeploymentCardProps {
    workload: WorkloadDeploymentDto;
    onOpenStrategy: (workload: WorkloadDeploymentDto) => void;
    onOpenRollback: (workload: WorkloadDeploymentDto) => void;
    onQuickPromote?: (workload: WorkloadDeploymentDto) => void;
    isMutating?: boolean;
}
