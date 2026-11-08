import type { RolloutActionRequest } from "../../pipeline";

export interface RolloutControlPanelProps {
    onAction: (action: RolloutActionRequest["action"], full?: boolean) => Promise<void>;
    isActing: boolean;
    activeStrategy?: 'canary' | 'bluegreen';
    onSwitchStrategy?: (strategy: 'canary' | 'bluegreen') => Promise<void>;
    namespace?: string;
    appName?: string;
    canaryWeight?: number;
    blueGreenActive?: 'blue' | 'green';
    isPaused?: boolean;
    onStepCanary?: (nextWeight: number) => Promise<void> | void;
}
