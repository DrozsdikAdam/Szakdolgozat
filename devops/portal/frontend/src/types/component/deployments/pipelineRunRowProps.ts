import type { PipelineRun, RolloutActionRequest } from "../../pipeline";

export interface PipelineRunRowProps {
    run: PipelineRun;
    onApproveClick: (run: PipelineRun) => void;
    onRolloutAction?: (action: RolloutActionRequest["action"], full?: boolean) => void;
    onStepCanary?: (nextWeight: number) => void;
    isRolloutActing?: boolean;
}
