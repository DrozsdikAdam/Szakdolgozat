export interface WizardNavProps {
    currentStep: number;
    totalSteps: number;
    stepTitles?: string;
    onNext: () => void;
    onPrev: () => void;
    onGoToStep: (step: number) => void;
    isLoading?: boolean;
    isLastStep: boolean;
    isFirstStep: boolean;
    children?: React.ReactNode;
}