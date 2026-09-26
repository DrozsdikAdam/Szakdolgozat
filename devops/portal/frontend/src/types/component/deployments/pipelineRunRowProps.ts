import type { PipelineRun } from "../../pipeline";

export interface PipelineRunRowProps {
    run: PipelineRun;
    onApproveClick: (run: PipelineRun) => void;
}
