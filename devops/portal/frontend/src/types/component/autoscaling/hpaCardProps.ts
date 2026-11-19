import type { UpdateHpaDto } from "../../k8s";

export interface HpaCardProps {
    currentHpa: UpdateHpaDto | null;
    selectMinReplicas: number;
    selectMaxReplicas: number;
    selectTargetCpu: number;
    onMinReplicasChange: (val: number) => void;
    onMaxReplicasChange: (val: number) => void;
    onTargetCpuChange: (val: number) => void;
    onSave: () => void;
    isLoading: boolean;
}
