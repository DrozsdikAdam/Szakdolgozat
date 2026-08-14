import { getRoleBadgeStyle, getRoleLabel } from "../constants/roles";
import { getWorkOrderPriorityBadgeStyle, getWorkOrderPriorityLabel, getWorkOrderStatusBadgeStyle, getWorkOrderStatusLabel } from "../constants/workOrder";
import type { BadgeProps } from "../types/Props";
import type { UserRoleBadgeProps, UserStatusBadgeProps } from "../types/user/UserProps";
import type { WorkOrderPriorityBadgeProps, WorkOrderStatusBadgeProps } from "../types/workorder/workOrderProps"



const userStatusBadgeStyles = {
    ACTIVE: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    INACTIVE: "bg-red-500/10 border-red-500/20 text-red-400"
}

export const WorkOrderStatusBadge = ({ status }: WorkOrderStatusBadgeProps) => {
    return badge({
        content: getWorkOrderStatusLabel(status),
        style: getWorkOrderStatusBadgeStyle(status)
    })
}

export const WorkOrderPriorityBadge = ({ priority }: WorkOrderPriorityBadgeProps) => {
    return badge({
        content: getWorkOrderPriorityLabel(priority),
        style: getWorkOrderPriorityBadgeStyle(priority)
    })
}

export const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
    return badge({ content: getRoleLabel(role), style: getRoleBadgeStyle(role) })
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