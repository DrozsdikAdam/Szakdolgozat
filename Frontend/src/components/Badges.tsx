import type { BadgeProps } from "../types/Props";
import type { UserRoleBadgeProps, UserStatusBadgeProps } from "../types/user/UserProps";
import type { WorkOrderPriorityBadgeProps, WorkOrderStatusBadgeProps } from "../types/workorder/workOrderProps"

const statusBadgeStyles = {
    PLANNED: "bg-slate-800 border-slate-700 text-slate-300",
    PREPARED: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    IN_PROGRESS: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    QUALITY_CHECK: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    COMPLETED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    CANCELLED: "bg-rose-500/10 border-rose-500/20 text-rose-400"
}

const priorityBadgeStyles = {
    LOW: "bg-slate-800 border-slate-700 text-slate-300",
    MEDIUM: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    HIGH: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    URGENT: "bg-red-500/10 border-red-500/20 text-red-400"
}

const roleBadgeStyles: Record<string, string> = {
    SYSTEMADMIN: "bg-red-500/10 border-red-500/20 text-red-400",
    CEO: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    MANAGER: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    OPERATOR: "bg-blue-500/10 border-blue-500/20 text-blue-400"
}

const userStatusBadgeStyles = {
    ACTIVE: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    INACTIVE: "bg-red-500/10 border-red-500/20 text-red-400"
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

export const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
    let props: BadgeProps;
    switch (role) {
        case "SYSTEMADMIN":
            props = {
                content: "Rendszergazda",
                style: roleBadgeStyles[role]
            };
            break;
        case "CEO":
            props = {
                content: "Vezérigazgató",
                style: roleBadgeStyles[role]
            };
            break;
        case "MANAGER":
            props = {
                content: "Menedzser",
                style: roleBadgeStyles[role]
            };
            break;
        case "OPERATOR":
            props = {
                content: "Operátor",
                style: roleBadgeStyles[role]
            };
            break;
        default:
            props = {
                content: "Ismeretlen",
                style: roleBadgeStyles["OPERATOR"]
            };
            break;
    }
    return badge(props)
}

export const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
    let props: BadgeProps;
    switch (status) {
        case "ACTIVE":
            props = {
                content: "Aktív",
                style: userStatusBadgeStyles[status]
            };
            break;
        case "INACTIVE":
            props = {
                content: "Inaktív",
                style: userStatusBadgeStyles[status]
            };
            break;
        default:
            props = {
                content: "Ismeretlen",
                style: userStatusBadgeStyles["INACTIVE"]
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