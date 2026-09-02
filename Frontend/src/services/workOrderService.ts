import { apiFetch } from "../utils/apiFetch";
import type { WorkOrderCreateRequest, WorkOrderResponse, WorkOrderStatus, WorkOrderStatusUpdateRequest, WorkOrderUpdateRequest } from "../types/workorder/workOrder";
import type { PagedResponse } from "../types/common/PagedResponse";
import { offlineDb } from "./offlineDb";
import type { CachedWorkOrder } from "../types/offline/offline";

const WORK_ORDER_BASE_URL = "/api/work-orders";

export const getWorkOrders = async (page: number = 0, size: number = 20, status: WorkOrderStatus | "ALL" = "ALL"): Promise<PagedResponse<WorkOrderResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (status !== "ALL") params.append("status", status);

    if (!navigator.onLine) {
        const cached = await offlineDb.cachedWorkOrders.toArray();
        return createOfflinePagedResponse(cached);
    }

    try {
        const response = await apiFetch<PagedResponse<WorkOrderResponse>>(`${WORK_ORDER_BASE_URL}?${params.toString()}`);
        if (response?.content) {
            for (const order of response.content) {
                await offlineDb.cachedWorkOrders.put({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    productName: order.productName,
                    targetQuantity: order.targetQuantity,
                    producedQuantity: order.producedQuantity,
                    scrapQuantity: order.scrapQuantity,
                    customerName: order.customerName,
                    assignedUserId: order.assignedUserId || undefined,
                    lastUpdated: Date.now()
                });
            }
        }
        return response;
    } catch (error) {
        if (!navigator.onLine) {
            const cached = await offlineDb.cachedWorkOrders.toArray();
            return createOfflinePagedResponse(cached);
        }
        throw error;
    }
}

export const getWorkOrderById = async (id: string | undefined): Promise<WorkOrderResponse> => {
    if (!id || id === "") throw new Error("Work order ID is undefined or empty");
    const url = `${WORK_ORDER_BASE_URL}/${id}`;
    return apiFetch<WorkOrderResponse>(url);
}

export const createWorkOrder = async (request: WorkOrderCreateRequest): Promise<WorkOrderResponse> => {
    return apiFetch<WorkOrderResponse>(WORK_ORDER_BASE_URL, {
        method: "POST",
        body: JSON.stringify(request)
    });
}

export const updateWorkOrderStatus = async (id: string, request: WorkOrderStatusUpdateRequest): Promise<WorkOrderResponse> => {
    const url = `${WORK_ORDER_BASE_URL}/${id}/status`;

    if (!navigator.onLine) {
        await offlineDb.saveOfflineAction(url, "PATCH", request);
        return { id, ...request } as unknown as WorkOrderResponse;
    }

    try {
        return await apiFetch<WorkOrderResponse>(url, {
            method: "PATCH",
            body: JSON.stringify(request)
        });
    } catch (error) {
        if (!navigator.onLine || (error instanceof TypeError && error.message.includes("fetch"))) {
            await offlineDb.saveOfflineAction(url, "PATCH", request);
            return { id, ...request } as unknown as WorkOrderResponse;
        }
        throw error;
    }
}

export const updateWorkOrderUser = async (id: string, userId: string): Promise<WorkOrderResponse> => {
    const url = `${WORK_ORDER_BASE_URL}/${id}/user/${userId}`;
    return apiFetch<WorkOrderResponse>(url, {
        method: "PATCH"
    })
}

export const updateWorkOrder = async (id: string, request: WorkOrderUpdateRequest): Promise<WorkOrderResponse> => {
    const url = `${WORK_ORDER_BASE_URL}/${id}`;
    return apiFetch<WorkOrderResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(request)
    })
}

const mapCachedToWorkOrderResponse = (c: CachedWorkOrder): WorkOrderResponse => {
    return {
        id: c.id,
        orderNumber: c.orderNumber,
        productName: c.productName,
        productSku: "",
        productId: "",
        customerName: c.customerName,
        assignedUserId: c.assignedUserId || null,
        assignedUserName: null,
        targetQuantity: c.targetQuantity,
        producedQuantity: c.producedQuantity,
        scrapQuantity: c.scrapQuantity,
        goodQuantity: c.producedQuantity - c.scrapQuantity,
        progressPercentage: c.targetQuantity ? Math.min(100, Math.round((c.producedQuantity / c.targetQuantity) * 100)) : 0,
        status: c.status as WorkOrderStatus,
        priority: "MEDIUM",
        createdAt: new Date(c.lastUpdated).toISOString()
    }
}

const createOfflinePagedResponse = (cached: CachedWorkOrder[]): PagedResponse<WorkOrderResponse> => {
    return {
        content: cached.map(mapCachedToWorkOrderResponse),
        pageNumber: 0,
        pageSize: cached.length || 20,
        totalElements: cached.length,
        totalPages: 1,
        first: true,
        last: true
    }
}