import type React from "react";

export type AuthFlowStep = "FORM" | "PROGRESS";

export interface UseLoginReturn {
    username: string;
    setUsername: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    authStep: AuthFlowStep;
    progress: number;
    progressState: "authenticating" | "failed" | "success";
    stageText: string;
    error: string | undefined;
    isPasswordValid: boolean;
    validationMessage: string;
    isSubmitDisabled: boolean;
    handleSubmit: (e?: React.FormEvent) => Promise<void>;
    resetForm: () => void;
}
