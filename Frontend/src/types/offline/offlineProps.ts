import type { OfflineAction } from "./offline";
import type { QuarantineItemResponse } from "./quarantine";

export interface ConflictCardProps {
    conflict: QuarantineItemResponse | OfflineAction;
    canManage?: boolean;
    onResolved: () => void;
}

export interface SyncConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
}