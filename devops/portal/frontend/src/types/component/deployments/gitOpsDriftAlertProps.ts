import type { GitOpsDriftReport } from "../../pipeline";

export interface GitOpsDriftAlertProps {
    driftReport: GitOpsDriftReport | null;
    onSync?: () => void;
    isSyncing?: boolean;
}
