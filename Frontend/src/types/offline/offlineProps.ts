import type { OfflineAction } from "./offline";

export interface ConflictCardProps {
    conflict: OfflineAction;
    onResolved: () => void;
}

export interface SyncConflictModalProps {
    isOpen: boolean;
    onClose?: () => void;
}