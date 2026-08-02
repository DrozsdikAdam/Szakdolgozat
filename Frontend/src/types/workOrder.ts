export type WorkOrderStatus = "PLANNED" |
    "PREPARED" |
    "IN_PROGRESS" |
    "QUALITY_CHECK" |
    "COMPLETED" |
    "CANCELLED";

export type WorkOrderPriority = "LOW" |
    "MEDIUM" |
    "HIGH" |
    "URGENT";


export interface WorkOrderResponse {
    id: string,
    orderNumber: string,
    productId: string,
    productName: string
    productSku: string,
    targetQuantity: number,
    producedQuantity: number,
    scrapQuantity: number,
    status: WorkOrderStatus,
    priority: WorkOrderPriority,
    createdAt: string,
    updatedAt?: string,
    startDate?: string,
    endDate?: string
}

export interface WorkOrderCreateRequest {
    productId: string,
    targetQuantity: number,
    status: WorkOrderStatus,
    priority: WorkOrderPriority
}

export interface WorkOrderStatusUpdateRequest {
    status: WorkOrderStatus,
    producedQuantity: number,
    scrapQuantity: number
}