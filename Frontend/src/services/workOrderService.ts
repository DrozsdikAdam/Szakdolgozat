import { apiFetch } from "../utils/apiFetch";
import type { WorkOrderCreateRequest, WorkOrderPriority, WorkOrderResponse, WorkOrderStatus, WorkOrderStatusUpdateRequest, WorkOrderUpdateRequest } from "../types/workOrder";

const WORK_ORDER_BASE_URL = "/api/work-orders";

export const getAllWorkOrders = async (): Promise<WorkOrderResponse[]> => {
    return apiFetch(WORK_ORDER_BASE_URL)
}

export const getWorkOrderById = async (id: string | undefined): Promise<WorkOrderResponse> => {
    if (!id || id === "") throw new Error("Work order ID is undefined or empty")
    const url = `${WORK_ORDER_BASE_URL}/${id}`
    return apiFetch(url)
}

export const getWorkOrderByStatus = async (status: WorkOrderStatus): Promise<WorkOrderResponse[]> => {
    const url = `${WORK_ORDER_BASE_URL}/status/${status}`
    return apiFetch(url)
}

export const createWorkOrder = async (workOrder: WorkOrderCreateRequest) => {
    return apiFetch(WORK_ORDER_BASE_URL, {
        method: "POST",
        body: JSON.stringify(workOrder)
    })
}

export const updateWorkOrderStatus = async (id: string, request: WorkOrderStatusUpdateRequest) => {
    const url = `${WORK_ORDER_BASE_URL}/${id}/status`;
    return apiFetch(url, {
        method: "PATCH",
        body: JSON.stringify(request)
    })
}

export const updateWorkOrderUser = async (id: string, userId: string) => {
    const url = `${WORK_ORDER_BASE_URL}/${id}/user/${userId}`;
    return apiFetch(url, {
        method: "PATCH"
    })
}

export const getWorkOrdersByStatusAndPriority = async (status: WorkOrderStatus, priority: WorkOrderPriority) => {
    const url = `${WORK_ORDER_BASE_URL}/status/${status}/priority/${priority}`;
    return apiFetch(url)
}

export const updateWorkOrder = async (id: string, request: WorkOrderUpdateRequest) => {
    const url = `${WORK_ORDER_BASE_URL}/${id}`;
    return apiFetch(url, {
        method: "PATCH",
        body: JSON.stringify(request)
    })
}

export const getWorkOrdersByProduct = async (productId: string) => {
    const url = `${WORK_ORDER_BASE_URL}/product/${productId}`;
    return apiFetch(url)
}

export const getWorkOrdersByPriority = async (priority: WorkOrderPriority) => {
    const url = `${WORK_ORDER_BASE_URL}/priority/${priority}`;
    return apiFetch(url)
}

export const getWorkOrdersByUser = async (userId: string) => {
    const url = `${WORK_ORDER_BASE_URL}/user/${userId}`;
    return apiFetch(url)
}

export const getWorkOrdersByCustomer = async (customerName: string) => {
    const url = `${WORK_ORDER_BASE_URL}/customer/${customerName}`;
    return apiFetch(url)
}
