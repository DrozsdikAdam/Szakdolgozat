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
        badgeStyle: "bg-slate-800 border-slate-700 text-slate-300",
    },
    PREPARED: {
        key: "PREPARED",
        label: "Előkészítve",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    },
    IN_PROGRESS: {
        key: "IN_PROGRESS",
        label: "Gyártásban",
        badgeStyle: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
    QUALITY_CHECK: {
        key: "QUALITY_CHECK",
        label: "Minőségellenőrzés",
        badgeStyle: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    },
    COMPLETED: {
        key: "COMPLETED",
        label: "Teljesítve",
        badgeStyle: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    },
    CANCELLED: {
        key: "CANCELLED",
        label: "Visszavont",
        badgeStyle: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    }
}

export const WorkOrderPriorities: Record<WorkOrderPriority, WorkOrderPriorityDefinition> = {
    LOW: {
        key: "LOW",
        label: "Alacsony",
        badgeStyle: "bg-slate-800 border-slate-700 text-slate-300",
    },
    MEDIUM: {
        key: "MEDIUM",
        label: "Közepes",
        badgeStyle: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    },
    HIGH: {
        key: "HIGH",
        label: "Magas",
        badgeStyle: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
    URGENT: {
        key: "URGENT",
        label: "Sürgős",
        badgeStyle: "bg-red-500/10 border-red-500/20 text-red-400",
    }
}

export const workOrderStatusOptions = Object.values(WorkOrderStatuses)

export const workOrderPriorityOptions = Object.values(WorkOrderPriorities)

export const getWorkOrderStatusLabel = (status: WorkOrderStatus) => WorkOrderStatuses[status].label

export const getWorkOrderPriorityLabel = (priority: WorkOrderPriority) => WorkOrderPriorities[priority].label

export const getWorkOrderStatusBadgeStyle = (status: WorkOrderStatus) => WorkOrderStatuses[status].badgeStyle

export const getWorkOrderPriorityBadgeStyle = (priority: WorkOrderPriority) => WorkOrderPriorities[priority].badgeStyle
