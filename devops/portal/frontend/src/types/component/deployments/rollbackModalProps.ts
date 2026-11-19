import type { WorkloadDeploymentDto, RollbackDeploymentDto } from "../../deployments";

export interface RollbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    workload: WorkloadDeploymentDto | null;
    onRollback: (dto: RollbackDeploymentDto) => Promise<void>;
    isRollingBack: boolean;
}
