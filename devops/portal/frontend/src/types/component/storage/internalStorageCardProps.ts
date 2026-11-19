import type { StorageOverViewDto, StorageTestResponseDto } from "../../storage";

export interface InternalStorageCardProps {
    overview: StorageOverViewDto | null;
    internalSizeGb: number;
    isDirty: boolean;
    isSaving: boolean;
    isTesting: boolean;
    testResult: StorageTestResponseDto | null;
    onSizeChange: (size: number) => void;
    onSave: () => void;
    onTestConnection: () => void;
    disabled?: boolean;
}
