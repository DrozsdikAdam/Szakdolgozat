import type { WorkOrderCreateRequest, WorkOrderResponse, WorkOrderStatus, WorkOrderStatusUpdateRequest, WorkOrderUpdateRequest } from "../types/workorder/workOrder";
import type { PagedResponse } from "../types/common/PagedResponse";
import { offlineDb } from "./offlineDb";
import type { CachedWorkOrder } from "../types/offline/offline";
import { fetchPagedWithOfflineCache, fetchItemWithOfflineCache, mutateWithOfflineQueue } from "../utils/offlineHelper";

const WORK_ORDER_BASE_URL = "/api/work-orders";

const mapCachedToWorkOrderResponse = (c: CachedWorkOrder): WorkOrderResponse => ({
    id: c.id,
    orderNumber: c.orderNumber,
    productName: c.productName,
    productSku: "",
    productId: "",
    customerName: c.customerName,
    assignedUserId: c.assignedUserId || null,
    assignedUserName: c.assignedUserName || (c.assignedUserId ? "Hozzárendelt operátor" : null),
    targetQuantity: c.targetQuantity,
    producedQuantity: c.producedQuantity,
    scrapQuantity: c.scrapQuantity,
    goodQuantity: c.producedQuantity - c.scrapQuantity,
    progressPercentage: c.targetQuantity ? Math.min(100, Math.round((c.producedQuantity / c.targetQuantity) * 100)) : 0,
    status: c.status as WorkOrderStatus,
    priority: "MEDIUM",
    createdAt: new Date(c.lastUpdated).toISOString()
});

const mapResponseToCache = (order: WorkOrderResponse): CachedWorkOrder => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    productName: order.productName,
    targetQuantity: order.targetQuantity,
    producedQuantity: order.producedQuantity,
    scrapQuantity: order.scrapQuantity,
    customerName: order.customerName,
    assignedUserId: order.assignedUserId || undefined,
    assignedUserName: order.assignedUserName || undefined,
    lastUpdated: Date.now()
});

export const getWorkOrders = async (
    page: number = 0,
    size: number = 20,
    status: WorkOrderStatus | "ALL" = "ALL"
): Promise<PagedResponse<WorkOrderResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status !== "ALL") params.append("status", status);

    return fetchPagedWithOfflineCache({
        url: `${WORK_ORDER_BASE_URL}?${params.toString()}`,
        table: offlineDb.cachedWorkOrders,
        mapToResponse: mapCachedToWorkOrderResponse,
        mapToCache: mapResponseToCache
    });
};

export const getWorkOrderById = async (id: string | undefined): Promise<WorkOrderResponse> => {
    if (!id || id === "") throw new Error("Work order ID is undefined or empty");
    return fetchItemWithOfflineCache({
        url: `${WORK_ORDER_BASE_URL}/${id}`,
        getCached: () => offlineDb.cachedWorkOrders.get(id),
        mapToResponse: mapCachedToWorkOrderResponse,
        mapToCache: mapResponseToCache,
        saveToCache: (item) => offlineDb.cachedWorkOrders.put(item)
    });
};

export const createWorkOrder = async (request: WorkOrderCreateRequest): Promise<WorkOrderResponse> => {
    return mutateWithOfflineQueue<WorkOrderResponse>({
        url: WORK_ORDER_BASE_URL,
        method: "POST",
        payload: request,
        entityName: `Munkalap létrehozása: ${request.customerName}`,
        applyOptimistic: async () => {
            const product = await offlineDb.cachedProducts.get(request.productId);
            const newOrder: CachedWorkOrder = {
                id: crypto.randomUUID(),
                orderNumber: `WO-${Date.now().toString().slice(-6)}`,
                status: request.status || "PLANNED",
                productName: product?.name || "Termék",
                targetQuantity: request.targetQuantity,
                producedQuantity: 0,
                scrapQuantity: 0,
                customerName: request.customerName,
                assignedUserId: request.assignedUserId,
                lastUpdated: Date.now()
            };
            await offlineDb.cachedWorkOrders.put(newOrder);
            return mapCachedToWorkOrderResponse(newOrder);
        },
        onSuccess: async (res) => {
            await offlineDb.cachedWorkOrders.put(mapResponseToCache(res));
        }
    });
};

export const updateWorkOrderStatus = async (
    id: string,
    request: WorkOrderStatusUpdateRequest
): Promise<WorkOrderResponse> => {
    return mutateWithOfflineQueue<WorkOrderResponse>({
        url: `${WORK_ORDER_BASE_URL}/${id}/status`,
        method: "PATCH",
        payload: request,
        actionType: "STATUS_UPDATE",
        entityName: "Munkalap státusz módosítása",
        applyOptimistic: async () => {
            await offlineDb.cachedWorkOrders.update(id, {
                status: request.status,
                producedQuantity: request.producedQuantity,
                scrapQuantity: request.scrapQuantity,
                lastUpdated: Date.now()
            });
            const existing = await offlineDb.cachedWorkOrders.get(id);
            if (existing) return mapCachedToWorkOrderResponse(existing);
            return { id, ...request } as unknown as WorkOrderResponse;
        },
        onSuccess: async (res) => {
            await offlineDb.cachedWorkOrders.put(mapResponseToCache(res));
        }
    });
};

export const updateWorkOrderUser = async (id: string, userId: string): Promise<WorkOrderResponse> => {
    return mutateWithOfflineQueue<WorkOrderResponse>({
        url: `${WORK_ORDER_BASE_URL}/${id}/user/${userId}`,
        method: "PATCH",
        payload: null,
        entityName: "Operátor hozzárendelése",
        applyOptimistic: async () => {
            await offlineDb.cachedWorkOrders.update(id, { assignedUserId: userId, lastUpdated: Date.now() });
            const existing = await offlineDb.cachedWorkOrders.get(id);
            if (existing) return mapCachedToWorkOrderResponse(existing);
            return { id, assignedUserId: userId } as unknown as WorkOrderResponse;
        },
        onSuccess: async () => {
            await offlineDb.cachedWorkOrders.update(id, { assignedUserId: userId, lastUpdated: Date.now() });
        }
    });
};

export const updateWorkOrder = async (id: string, request: WorkOrderUpdateRequest): Promise<WorkOrderResponse> => {
    return mutateWithOfflineQueue<WorkOrderResponse>({
        url: `${WORK_ORDER_BASE_URL}/${id}`,
        method: "PATCH",
        payload: request,
        entityName: "Munkalap módosítása",
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedWorkOrders.get(id);
            const updated: CachedWorkOrder = {
                id,
                orderNumber: existing?.orderNumber || "",
                status: existing?.status || "PLANNED",
                productName: existing?.productName || "Termék",
                targetQuantity: request.targetQuantity ?? existing?.targetQuantity ?? 0,
                producedQuantity: existing?.producedQuantity ?? 0,
                scrapQuantity: existing?.scrapQuantity ?? 0,
                customerName: request.customerName ?? existing?.customerName ?? "",
                assignedUserId: request.assignedUserId ?? existing?.assignedUserId,
                lastUpdated: Date.now()
            };
            await offlineDb.cachedWorkOrders.put(updated);
            return mapCachedToWorkOrderResponse(updated);
        },
        onSuccess: async (res) => {
            await offlineDb.cachedWorkOrders.put(mapResponseToCache(res));
        }
    });
};