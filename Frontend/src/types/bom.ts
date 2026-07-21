export interface BOMResponse {
    id: String,
    parentProductId: string,
    componentProductId: string,
    componentProductName: string,
    componentProductSku: string,
    quantity: number,
    active: boolean
}

export interface BOMItemRequest {
    parentProductId: string,
    componentProductId: string,
    quantity: number
}

export interface BOMTreeNode {
    productId: string,
    productName: string,
    productSku: string,
    unit: string,
    quantity: number,
    children: BOMTreeNode[]
}