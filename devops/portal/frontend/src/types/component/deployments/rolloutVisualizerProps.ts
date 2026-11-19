import type { WorkloadDeploymentDto } from "../../deployments";

export interface RolloutVisualizerProps {
    workload: WorkloadDeploymentDto;
    onQuickPromote?: (workload: WorkloadDeploymentDto) => void;
    isMutating?: boolean;
}
