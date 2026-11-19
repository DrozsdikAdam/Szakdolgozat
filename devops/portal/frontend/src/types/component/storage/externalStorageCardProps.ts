import type { StorageFormData, StorageTestResponseDto } from "../../storage";

export interface ExternalStorageCardProps {
    formData: StorageFormData;
    isDirty: boolean;
    isSaving: boolean;
    isTesting: boolean;
    testResult: StorageTestResponseDto | null;
    onFieldChange: (field: keyof StorageFormData, value: any) => void;
    onSave: () => void;
    onTestConnection: () => void;
    disabled?: boolean;
}
