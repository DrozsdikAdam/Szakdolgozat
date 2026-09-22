export interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    name: string;
    namespace: string;
    isSecret: boolean;
    isDeleting?: boolean;
}
