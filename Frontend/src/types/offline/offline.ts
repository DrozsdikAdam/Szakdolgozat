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
    assignedUserName?: string,
    lastUpdated: number
}

export type CachedProduct = {
    id: string,
    name: string,
    sku: string,
    description?: string,
    unit: string,
    active: boolean,
    createdAt: string,
    lastUpdated: number
}

export type CachedInventory = {
    id: string,
    productId: string | null,
    productName: string | null,
    productSku: string | null,
    quantity: number,
    reservedQuantity: number,
    location: string | null,
    updatedAt: string,
    lastUpdated: number
}

export type CachedMachine = {
    id: string,
    name: string,
    code: string,
    type: string,
    status: string,
    idealCycleTimeSeconds: number,
    targetPcsPerHour: number,
    active: boolean,
    manufacturer?: string,
    model?: string,
    serialNumber?: string,
    warrantyNumber?: string,
    warrantyEndDate?: string,
    location?: string,
    assignedUserId?: string,
    assignedUserName?: string,
    lastUpdated: number
}

export type CachedMaintenance = {
    id: string,
    machineId: string,
    machineCode: string,
    machineName: string,
    title: string,
    status: string,
    type: string,
    createdAt: string,
    updatedAt: string,
    technicianId?: string,
    technicianName?: string,
    description?: string,
    rootCause?: string,
    actionTaken?: string,
    downtimeMinutes?: number,
    cost?: number,
    start?: string,
    end?: string,
    lastUpdated: number
}

export type CachedBom = {
    parentProductId: string,
    tree: any,
    lastUpdated: number
}

export interface SyncStatus {
    isSyncing: boolean;
    total: number;
    current: number;
    conflictCount: number;
}
