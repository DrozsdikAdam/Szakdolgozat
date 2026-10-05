import type { DatabaseFormData, TestConnectionResultDto } from "../../database";

export interface ConnectionConfigCardProps {
    formData: DatabaseFormData;
    isDirty: boolean;
    isPinging: boolean;
    isSaving: boolean;
    pingResult: TestConnectionResultDto | null;
    onFieldChange: (field: keyof DatabaseFormData, value: any) => void;
    onTestConnection: () => void;
    onSaveConfig: () => void;
    disabled?: boolean | undefined;
}
