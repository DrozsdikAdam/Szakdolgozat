import type { PodTableItem } from "./podTableProps";

export interface PodLogModalProps {
    pod: PodTableItem;
    onClose: () => void;
}
