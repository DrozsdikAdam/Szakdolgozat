import type { WorkloadDeploymentDto, UpdateDeploymentStrategyDto } from "../../deployments";

export interface DeploymentStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    workload: WorkloadDeploymentDto | null;
    onSave: (dto: UpdateDeploymentStrategyDto) => Promise<void>;
    isSaving: boolean;
}
