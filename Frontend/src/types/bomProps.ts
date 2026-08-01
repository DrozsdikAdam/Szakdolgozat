import type { BOMTreeNode } from "./bom";
import type { ProductResponse } from "./Product";

export interface BOMSelectProps {
    products: ProductResponse[],
    selectedProductId: string | null,
    setSelectedProductId: (id: string) => void,
    quantity: number,
    setQuantity: (quantity: number) => void,
    openAddModal: () => void
}

export interface BOMTreeViewProps {
    treeNodes: BOMTreeNode | null
}

export interface TreeNodeCardProps {
    node: BOMTreeNode
    level: number
}

export interface AddBOMComponentModalProps {
    isOpen: boolean,
    closeModal: () => void,
    parentProductId: string,
    products: ProductResponse[],
    onSuccess: () => void
}