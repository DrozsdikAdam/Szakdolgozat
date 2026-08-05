import type { User } from "../user/User";
import type { ProductResponse } from "../product/Product";
import type { WorkOrderPriority, WorkOrderResponse, WorkOrderStatus } from "./workOrder";

export interface WorkOrderStatsCardProps {
    orders: WorkOrderResponse[]
}

export interface WorkOrderFilterBarProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
    statusFilter: WorkOrderStatus | "ALL",
    setStatusFilter: (status: WorkOrderStatus | "ALL") => void,
    priorityFilter: WorkOrderPriority | "ALL",
    setPriorityFilter: (priority: WorkOrderPriority | "ALL") => void,
    openCreateModal: () => void
}

export interface WorkOrderCardProps {
    order: WorkOrderResponse,
    onUpdateStatus: (order: WorkOrderResponse, newStatus: WorkOrderStatus) => void,
    onEditOrder: (order: WorkOrderResponse) => void
}

export interface CreateWorkOrderModalProps {
    isOpen: boolean,
    closeModal: () => void,
    products: ProductResponse[],
    onSuccess: () => void,
    users: User[]
}

export interface EditWorkOrderModalProps {
    isOpen: boolean,
    closeModal: () => void,
    order: WorkOrderResponse | null,
    onSuccess: () => void,
    users: User[]
}

export interface WorkOrderStatusBadgeProps {
    status: WorkOrderStatus
}

export interface WorkOrderPriorityBadgeProps {
    priority: WorkOrderPriority
}