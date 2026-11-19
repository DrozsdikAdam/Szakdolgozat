import type { ConfigMapDto, SecretDto, SaveConfigDto } from "../../config";

export interface ConfigEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: SaveConfigDto, isSecret: boolean) => Promise<void>;
    isSecret: boolean;
    initialData?: ConfigMapDto | SecretDto | null;
    currentNamespace?: string;
    isSaving?: boolean;
}
