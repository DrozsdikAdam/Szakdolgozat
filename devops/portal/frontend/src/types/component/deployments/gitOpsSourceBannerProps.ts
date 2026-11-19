import type { GitRepoConfig } from "../../deployments";

export interface GitOpsSourceBannerProps {
    gitRepo: GitRepoConfig | null;
    onSync: () => void;
    isSyncing: boolean;
}
