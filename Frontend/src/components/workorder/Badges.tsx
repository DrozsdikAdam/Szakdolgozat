import type { WorkOrderPriorityBadgeProps, WorkOrderStatusBadgeProps } from "../../types/workorder/workOrderProps"

interface BadgeProps {
    content: string;
    style: string;
}

const statusBadgeStyles = {
    PLANNED: "bg-slate-800 border-slate-700 text-slate-300",
    PREPARED: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    IN_PROGRESS: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    QUALITY_CHECK: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    COMPLETED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    CANCELLED: "bg-slate-700/60 border-slate-700 text-slate-400"
}

const priorityBadgeStyles = {
    LOW: "bg-slate-800 border-slate-700 text-slate-300",
    MEDIUM: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    HIGH: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    URGENT: "bg-red-500/10 border-red-500/20 text-red-400"
}

export const WorkOrderStatusBadge = ({ status }: WorkOrderStatusBadgeProps) => {
    let props: BadgeProps;
    switch (status) {
        case "PLANNED":
            props = {
                content: "Tervezett",
                style: statusBadgeStyles[status]
            };
            break;
        case "PREPARED":
            props = {
                content: "Előkészítve",
                style: statusBadgeStyles[status]
            };
            break;
        case "IN_PROGRESS":
            props = {
                content: "Gyártásban",
                style: statusBadgeStyles[status]
            };
            break;
        case "QUALITY_CHECK":
            props = {
                content: "Minőségellenőrzés",
                style: statusBadgeStyles[status]
            };
            break;
        case "COMPLETED":
            props = {
                content: "Teljesítve",
                style: statusBadgeStyles[status]
            };
            break;
        case "CANCELLED":
            props = {
                content: "Visszavont",
                style: statusBadgeStyles[status]
            };
            break;
        default:
            props = {
                content: "Ismeretlen",
                style: statusBadgeStyles["CANCELLED"]
            };
            break;
    }
    return badge(props)
}


export const WorkOrderPriorityBadge = ({ priority }: WorkOrderPriorityBadgeProps) => {
    let props: BadgeProps;
    switch (priority) {
        case "LOW":
            props = {
                content: "Alacsony",
                style: priorityBadgeStyles[priority]
            };
            break;
        case "MEDIUM":
            props = {
                content: "Közepes",
                style: priorityBadgeStyles[priority]
            };
            break;
        case "HIGH":
            props = {
                content: "Magas",
                style: priorityBadgeStyles[priority]
            };
            break;
        case "URGENT":
            props = {
                content: "Sürgős",
                style: priorityBadgeStyles[priority]
            };
            break;
        default:
            props = {
                content: "Ismeretlen",
                style: priorityBadgeStyles["LOW"]
            };
            break;
    }
    return badge(props)
}

const badge = ({ content, style }: BadgeProps) => {
    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${style}`}>
            <span className="text-xs font-semibold">{content}</span>
        </div>
    )
}