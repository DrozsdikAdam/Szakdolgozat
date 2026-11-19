import type { DeploymentStrategy } from "../../deployments";

export type StrategyFilterType = "all" | DeploymentStrategy;

export interface StrategyFilterTabsProps {
    currentFilter: StrategyFilterType;
    onSelectFilter: (filter: StrategyFilterType) => void;
    counts: {
        all: number;
        RollingUpdate: number;
        Canary: number;
        BlueGreen: number;
    };
}
