import { apiFetch } from "../utils/apiFetch";
import type { WorkOrderCreateRequest, WorkOrderResponse, WorkOrderStatus, WorkOrderStatusUpdateRequest, WorkOrderUpdateRequest } from "../types/workorder/workOrder";
import type { PagedResponse } from "../types/common/PagedResponse";

const WORK_ORDER_BASE_URL = "/api/work-orders";

export const getWorkOrders = async (page: number = 0, size: number = 20, status: WorkOrderStatus | "ALL" = "ALL"): Promise<PagedResponse<WorkOrderResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (status !== "ALL") params.append("status", status)
    return apiFetch<PagedResponse<WorkOrderResponse>>(`${WORK_ORDER_BASE_URL}?${params.toString()}`)
}

export const getWorkOrderById = async (id: string | undefined): Promise<WorkOrderResponse> => {
    if (!id || id === "") throw new Error("Work order ID is undefined or empty")
    const url = `${WORK_ORDER_BASE_URL}/${id}`
    return apiFetch<WorkOrderResponse>(url)
}

export const createWorkOrder = async (request: WorkOrderCreateRequest): Promise<WorkOrderResponse> => {
    return apiFetch<WorkOrderResponse>(WORK_ORDER_BASE_URL, {
        method: "POST",
        body: JSON.stringify(request)
    })
}

export const updateWorkOrderStatus = async (id: string, request: WorkOrderStatusUpdateRequest): Promise<WorkOrderResponse> => {
    const url = `${WORK_ORDER_BASE_URL}/${id}/status`;
    return apiFetch<WorkOrderResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(request)
    })
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