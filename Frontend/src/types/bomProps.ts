import type { BOMTreeNode } from "./bom";
import type { ProductResponse } from "./Product";

export interface BOMSelectProps {
    products: ProductResponse[],
    selectedProductId: string,
    setSelectedProductId: (id: string) => void,
    quantity: number,
    setQuantity: (quantity: number) => void
    openAddModal: () => void
}

export interface BOMTreeViewProps {
    treeNode: BOMTreeNode | null
}

export interface AddBOMComponentModalProps {
    isOpen: boolean,
    closeModal: () => void,
    parentProductId: string,
    products: ProductResponse[],
    onSuccess: () => void
}