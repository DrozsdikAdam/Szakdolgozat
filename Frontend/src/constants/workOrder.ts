import type { WorkOrderPriority, WorkOrderStatus } from "../types/workorder/workOrder";

export interface WorkOrderStatusDefinition {
    key: WorkOrderStatus,
    label: "Tervezett" | "Előkészítve" | "Gyártásban" | "Minőségellenőrzés" | "Teljesítve" | "Visszavont",
    badgeStyle: string,
}

export interface WorkOrderPriorityDefinition {
    key: WorkOrderPriority,
    label: "Alacsony" | "Közepes" | "Magas" | "Sürgős",
    badgeStyle: string,
}

export const WorkOrderStatuses: Record<WorkOrderStatus, WorkOrderStatusDefinition> = {
    PLANNED: {
        key: "PLANNED",
        label: "Tervezett",
        badgeStyle: "badge-neutral",
    },
    PREPARED: {
        key: "PREPARED",
        label: "Előkészítve",
        badgeStyle: "badge-info",
    },
    IN_PROGRESS: {
        key: "IN_PROGRESS",
        label: "Gyártásban",
        badgeStyle: "badge-warning",
    },
    QUALITY_CHECK: {
        key: "QUALITY_CHECK",
        label: "Minőségellenőrzés",
        badgeStyle: "badge-purple",
    },
    COMPLETED: {
        key: "COMPLETED",
        label: "Teljesítve",
        badgeStyle: "badge-success",
    },
    CANCELLED: {
        key: "CANCELLED",
        label: "Visszavont",
        badgeStyle: "badge-danger",
    }
}

export const WorkOrderPriorities: Record<WorkOrderPriority, WorkOrderPriorityDefinition> = {
    LOW: {
        key: "LOW",
        label: "Alacsony",
        badgeStyle: "badge-neutral",
    },
    MEDIUM: {
        key: "MEDIUM",
        label: "Közepes",
        badgeStyle: "badge-info",
    },
    HIGH: {
        key: "HIGH",
        label: "Magas",
        badgeStyle: "badge-warning",
    },
    URGENT: {
        key: "URGENT",
        label: "Sürgős",
        badgeStyle: "badge-danger",
    }
}

export const workOrderStatusOptions = Object.values(WorkOrderStatuses)

export const workOrderPriorityOptions = Object.values(WorkOrderPriorities)

export const getWorkOrderStatusLabel = (status: WorkOrderStatus) => WorkOrderStatuses[status]?.label ?? "Ismeretlen"

export const getWorkOrderPriorityLabel = (priority: WorkOrderPriority) => WorkOrderPriorities[priority]?.label ?? "Ismeretlen"

export const getWorkOrderStatusBadgeStyle = (status: WorkOrderStatus) => WorkOrderStatuses[status]?.badgeStyle ?? "badge-neutral"

export const getWorkOrderPriorityBadgeStyle = (priority: WorkOrderPriority) => WorkOrderPriorities[priority]?.badgeStyle ?? "badge-neutral"
