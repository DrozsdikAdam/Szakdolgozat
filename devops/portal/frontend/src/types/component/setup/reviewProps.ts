import type { SetupFormData } from "./setupDataProps";

export interface ReviewStepProps {
    data: SetupFormData
    onGoToStep: (stepNumber: number) => void
}