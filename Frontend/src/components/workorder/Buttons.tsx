import { CheckCircle2, Clock, PlayCircle, ShieldCheck, Warehouse, XCircle, type LucideIcon } from "lucide-react"
import type { WorkOrderStatus } from "../../types/workorder/workOrder"

interface WorkOrderActionButtonProps {
    status: WorkOrderStatus
    onClick: (nextStatus: WorkOrderStatus) => void
    disabled?: boolean
}

interface ButtonConfig {
    text: string
    nextStatus?: WorkOrderStatus
    style: string
    icon: LucideIcon
    isAction: boolean
}

const buttonConfigs: Record<WorkOrderStatus, ButtonConfig> = {
    PLANNED: {
        text: "Előkészítés indítása",
        nextStatus: "PREPARED",
        style: "bg-(--cud-skyblue-bg) border-(--cud-skyblue-border) text-cud-skyblue hover:bg-(--cud-skyblue)/20",
        icon: Clock,
        isAction: true
    },
    PREPARED: {
        text: "Gyártás indítása",
        nextStatus: "IN_PROGRESS",
        style: "bg-(--cud-orange-bg) border-(--cud-orange-border) text-cud-orange hover:bg-(--cud-orange)/20",
        icon: PlayCircle,
        isAction: true
    },
    IN_PROGRESS: {
        text: "Minőségellenőrzés",
        nextStatus: "QUALITY_CHECK",
        style: "bg-(--cud-purple-bg) border-(--cud-purple-border) text-cud-purple hover:bg-(--cud-purple)/20",
        icon: ShieldCheck,
        isAction: true
    },
    QUALITY_CHECK: {
        text: "Befejezés & Raktárra tétel",
        nextStatus: "COMPLETED",
        style: "bg-(--cud-teal-bg) border-(--cud-teal-border) text-cud-teal hover:bg-(--cud-teal)/20",
        icon: Warehouse,
        isAction: true
    },
    COMPLETED: {
        text: "Gyártás befejezve",
        style: "badge-success",
        icon: CheckCircle2,
        isAction: false
    },
    CANCELLED: {
        text: "Megszakítva",
        style: "badge-neutral",
        icon: XCircle,
        isAction: false
    }
}

const PrivateButton = ({ config, onClick, disabled }: { config: ButtonConfig; onClick?: () => void; disabled?: boolean }) => {
    const Icon = config.icon
    return (
        <button
            onClick={onClick}
            disabled={disabled || !config.isAction}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all shadow-sm ${config.style} ${!config.isAction ? "cursor-default" : "hover:opacity-90 active:scale-95"}`}
        >
            <Icon size={16} />
            <span>{config.text}</span>
        </button>
    )
}

export const WorkOrderActionButton = ({ status, onClick, disabled }: WorkOrderActionButtonProps) => {
    const config = buttonConfigs[status]
    if (!config) return null

    const handleNext = () => {
        if (config.nextStatus) {
            onClick(config.nextStatus)
        }
    }

    return (
        <PrivateButton
            config={config}
            onClick={config.isAction ? handleNext : undefined}
            disabled={disabled}
        />
    )
}