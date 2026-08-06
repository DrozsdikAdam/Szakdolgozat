export interface InventoryResponse {
    id: string,
    productId: string | null,
    productName: string | null,
    productSku: string | null,
    quantity: number,
    reservedQuantity: number,
    location: string | null,
    updatedAt: string
}

export interface InventoryUpdateRequest {
    productId: string,
    amount: number,
    location?: string
}