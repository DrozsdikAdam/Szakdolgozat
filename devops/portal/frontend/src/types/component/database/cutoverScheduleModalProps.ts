import type { DatabaseEngine, CutoverStatusDto } from "../../database";

export interface CutoverScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetEngine: DatabaseEngine;
    currentEngine: DatabaseEngine;
    cutoverStatus: CutoverStatusDto | null;
    isScheduling: boolean;
    isCancelling: boolean;
    onScheduleCutover: (params: {
        scheduledAt: string;
        targetEngine: DatabaseEngine;
        enableMaintenanceMode: boolean;
        restartBackend: boolean;
    }) => Promise<void>;
    onCancelCutover: () => Promise<void>;
}
