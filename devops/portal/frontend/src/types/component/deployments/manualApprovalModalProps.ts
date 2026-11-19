import type { PipelineRun } from "../../pipeline";

export interface ManualApprovalModalProps {
    isOpen: boolean;
    run: PipelineRun | null;
    isSubmitting: boolean;
    onClose: () => void;
    onApprove: (decision: "approved" | "rejected", comment?: string) => Promise<void>;
}
