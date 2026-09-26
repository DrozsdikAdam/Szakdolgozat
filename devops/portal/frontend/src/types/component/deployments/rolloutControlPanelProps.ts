import type { RolloutActionRequest } from "../../pipeline";

export interface RolloutControlPanelProps {
    onAction: (action: RolloutActionRequest["action"], full?: boolean) => Promise<void>;
    isActing: boolean;
}
