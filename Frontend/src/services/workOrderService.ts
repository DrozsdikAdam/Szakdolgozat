import { apiFetch } from "../utils/apiFetch";
import type { WorkOrderCreateRequest, WorkOrderPriority, WorkOrderResponse, WorkOrderStatus, WorkOrderStatusUpdateRequest, WorkOrderUpdateRequest } from "../types/workorder/workOrder";

const WORK_ORDER_BASE_URL = "/api/work-orders";

export const getWorkOrders = async (): Promise<WorkOrderResponse[]> => {
    return apiFetch<WorkOrderResponse[]>(WORK_ORDER_BASE_URL)
}

export const getWorkOrderById = async (id: string | undefined): Promise<WorkOrderResponse> => {
    if (!id || id === "") throw new Error("Work order ID is undefined or empty")
    const url = `${WORK_ORDER_BASE_URL}/${id}`
    return apiFetch<WorkOrderResponse>(url)
}

export const getWorkOrderByStatus = async (status: WorkOrderStatus): Promise<WorkOrderResponse[]> => {
    const url = `${WORK_ORDER_BASE_URL}/status/${status}`
    return apiFetch<WorkOrderResponse[]>(url)
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

export const getWorkOrdersByStatusAndPriority = async (status: WorkOrderStatus, priority: WorkOrderPriority): Promise<WorkOrderResponse[]> => {
    const url = `${WORK_ORDER_BASE_URL}/status/${status}/priority/${priority}`;
    return apiFetch<WorkOrderResponse[]>(url)
}

export const updateWorkOrder = async (id: string, request: WorkOrderUpdateRequest): Promise<WorkOrderResponse> => {
    const url = `${WORK_ORDER_BASE_URL}/${id}`;
    return apiFetch<WorkOrderResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(request)
    })
}

export const getWorkOrdersByProduct = async (productId: string): Promise<WorkOrderResponse[]> => {
    const url = `${WORK_ORDER_BASE_URL}/product/${productId}`;
    return apiFetch<WorkOrderResponse[]>(url)
}

export const getWorkOrdersByPriority = async (priority: WorkOrderPriority): Promise<WorkOrderResponse[]> => {
    const url = `${WORK_ORDER_BASE_URL}/priority/${priority}`;
    return apiFetch<WorkOrderResponse[]>(url)
}

export const getWorkOrdersByUser = async (userId: string): Promise<WorkOrderResponse[]> => {
    const url = `${WORK_ORDER_BASE_URL}/user/${userId}`;
    return apiFetch<WorkOrderResponse[]>(url)
}

export const getWorkOrdersByCustomer = async (customerName: string): Promise<WorkOrderResponse[]> => {
    const url = `${WORK_ORDER_BASE_URL}/customer/${customerName}`;
    return apiFetch<WorkOrderResponse[]>(url)
}
