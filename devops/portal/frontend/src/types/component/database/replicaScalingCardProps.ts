export interface ReplicaScalingCardProps {
    replicas: number;
    poolSize: number;
    maxReplicas?: number | undefined;
    isScaling: boolean;
    onReplicasChange: (replicas: number) => void;
    onPoolSizeChange: (poolSize: number) => void;
    onApplyScale: () => void;
    disabled?: boolean | undefined;
}
