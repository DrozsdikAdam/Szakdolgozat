import { getRoleBadgeStyle, getRoleLabel } from "../../constants/roles";
import { getWorkOrderPriorityBadgeStyle, getWorkOrderPriorityLabel, getWorkOrderStatusBadgeStyle, getWorkOrderStatusLabel } from "../../constants/workOrder";
import type { BadgeProps } from "../../types/Props";
import type { UserRoleBadgeProps, UserStatusBadgeProps } from "../../types/user/UserProps";
import type { WorkOrderPriorityBadgeProps, WorkOrderStatusBadgeProps } from "../../types/workorder/workOrderProps"
import { getUserStatusBadgeStyle, getUserStatusLabel } from "../../constants/userStatus";
import type { MaintenanceStatusBadgeProps, MaintenanceTypeBadgeProps } from "../../types/maintenance/MaintenanceProps";
import { getMaintenanceStatusBadgeStyle, getMaintenanceStatusLabel } from "../../constants/maintenanceStatus";
import { getMaintenanceTypeBadgeStyle, getMaintenanceTypeLabel } from "../../constants/maintenanceType";
import { getMachineTypeBadgeStyle, getMachineTypeLabel } from "../../constants/machineType";
import { getMachineStatusBadgeStyle, getMachineStatusLabel } from "../../constants/machineStatus";
import type { MachineStatusBadgeProps, MachineTypeBadgeProps } from "../../types/machine/MachineProps";

export const WorkOrderStatusBadge = ({ status }: WorkOrderStatusBadgeProps) => {
    const props: BadgeProps = {
        content: getWorkOrderStatusLabel(status),
        style: getWorkOrderStatusBadgeStyle(status)
    }
    return badge(props)
}

export const WorkOrderPriorityBadge = ({ priority }: WorkOrderPriorityBadgeProps) => {
    const props: BadgeProps = {
        content: getWorkOrderPriorityLabel(priority),
        style: getWorkOrderPriorityBadgeStyle(priority)
    }
    return badge(props)
}

export const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
    const props: BadgeProps = {
        content: getRoleLabel(role),
        style: getRoleBadgeStyle(role)
    }
    return badge(props)
}

export const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
    const props: BadgeProps = {
        content: getUserStatusLabel(status),
        style: getUserStatusBadgeStyle(status)
    }
    return badge(props)
}

export const MaintenanceStatusBadge = ({ status }: MaintenanceStatusBadgeProps) => {
    const props: BadgeProps = {
        content: getMaintenanceStatusLabel(status),
        style: getMaintenanceStatusBadgeStyle(status)
    }
    return badge(props)
}

export const MaintenanceTypeBadge = ({ type }: MaintenanceTypeBadgeProps) => {
    const props: BadgeProps = {
        content: getMaintenanceTypeLabel(type),
        style: getMaintenanceTypeBadgeStyle(type)
    }
    return badge(props)
}

export const MachineTypeBadge = ({ type }: MachineTypeBadgeProps) => {
    const props: BadgeProps = {
        content: getMachineTypeLabel(type),
        style: getMachineTypeBadgeStyle(type)
    }
    return badge(props)
}

export const MachineStatusBadge = ({ status }: MachineStatusBadgeProps) => {
    const props: BadgeProps = {
        content: getMachineStatusLabel(status),
        style: getMachineStatusBadgeStyle(status)
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