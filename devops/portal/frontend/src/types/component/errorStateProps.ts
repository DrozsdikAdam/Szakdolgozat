import type { ReactNode } from "react";

export type ErrorStateType =
    | "connection-refused"
    | "service-unavailable"
    | "not-found"
    | "timeout"
    | "generic";

export interface ErrorStateProps {
    type?: ErrorStateType;
    title?: string;
    message?: string;
    errorCode?: string | number;
    targetService?: string;
    targetUrl?: string;
    troubleshootingSteps?: string[];
    onRetry?: () => void;
    onBack?: () => void;
    action?: ReactNode;
    className?: string;
}
