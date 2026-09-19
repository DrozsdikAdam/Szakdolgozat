import type { StatusConfigType } from "../types/component/healthcheck/healthcheckConstant";

export const statusConfig: Record<string, StatusConfigType> = {
    healthy: { variant: 'teal', label: 'Egészséges', pulse: true },
    warning: { variant: 'orange', label: 'Figyelmeztetés', pulse: false },
    critical: { variant: 'vermillon', label: 'Kritikus', pulse: true },
    unconfigured: { variant: 'purple', label: 'Nincs szonda', pulse: false }
};