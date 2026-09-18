export interface RestartConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    namespace: string;
    workloadNames: string[];
    isRestarting?: boolean;
}
