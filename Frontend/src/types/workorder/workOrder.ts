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
    customerName: string,
    assignedUserId: string | null,
    assignedUserName: string | null,
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
    customerName: string,
    status: WorkOrderStatus,
    priority: WorkOrderPriority,
    assignedUserId?: string
}

export interface WorkOrderStatusUpdateRequest {
    status: WorkOrderStatus,
    producedQuantity: number,
    scrapQuantity: number
}

export interface WorkOrderUpdateRequest {
    targetQuantity: number,
    priority: WorkOrderPriority,
    customerName: string,
    assignedUserId?: string
}