import type { ConfigMapDto, SecretDto } from "../../config";

export interface ConfigCardProps {
    item: ConfigMapDto | SecretDto;
    isSecret: boolean;
    revealedData?: Record<string, string>;
    isRevealing?: boolean;
    onRevealToggle?: (item: SecretDto) => void;
    onEdit: (item: ConfigMapDto | SecretDto) => void;
    onDelete: (item: ConfigMapDto | SecretDto) => void;
    onRestartWorkload: (namespace: string, workloadNames: string[]) => void;
}
