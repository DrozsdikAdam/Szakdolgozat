import type { StorageMode } from "../../storage";

export interface StorageModeSelectorCardProps {
    selectedMode: StorageMode;
    onModeChange: (mode: StorageMode) => void;
    disabled?: boolean;
}
