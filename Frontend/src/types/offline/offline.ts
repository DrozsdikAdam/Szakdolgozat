export type OfflineAction = {
    id?: number,
    uuid: string,
    type: "STATUS_UPDATE" | 'QUANTITY_REPORT' | 'EMERGENCY_STOP' | 'GENERIC',
    endpoint: string,
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    payload: unknown,
    timestamp: number,
    status: 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFLICT',
    retryCount: number,
    error?: string,
    serverConflictData?: any,
    entityName: string
}

export type CachedWorkOrder = {
    id: string,
    orderNumber: string,
    status: string,
    productName: string,
    targetQuantity: number,
    producedQuantity: number,
    scrapQuantity: number,
    customerName: string,
    assignedUserId?: string,
    lastUpdated: number
}