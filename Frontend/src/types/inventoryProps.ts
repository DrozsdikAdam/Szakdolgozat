import type { InventoryResponse } from "./inventory"

export interface InventoryChartProps {
    productName: string | null,
    productSku: string | null,
    quantity: number,
    reservedQuantity: number,
    location: string | null
}

export interface InventoryFilterBarProps {
    searchTerm: string,
    setSearchTerm: (searchTerm: string) => void,
    locationFilter: string,
    setLocationFilter: (locationFilter: string) => void,
    openModal: () => void
}

export interface InventoryTableProps {
    data: InventoryResponse[],
    openModal: (inventoryId: string) => void
}

export interface AdjustModalProps {
    inventoryId: string | null,
    currentQuantity: number,
    isOpen: boolean,
    closeModal: () => void,
    onUpdate: () => void
}