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
        style: "bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30",
        icon: Clock,
        isAction: true
    },
    PREPARED: {
        text: "Gyártás indítása",
        nextStatus: "IN_PROGRESS",
        style: "bg-amber-600/20 border-amber-500/40 text-amber-400 hover:bg-amber-600/30",
        icon: PlayCircle,
        isAction: true
    },
    IN_PROGRESS: {
        text: "Minőségellenőrzés",
        nextStatus: "QUALITY_CHECK",
        style: "bg-purple-600/20 border-purple-500/40 text-purple-400 hover:bg-purple-600/30",
        icon: ShieldCheck,
        isAction: true
    },
    QUALITY_CHECK: {
        text: "Befejezés & Raktárra tétel",
        nextStatus: "COMPLETED",
        style: "bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30",
        icon: Warehouse,
        isAction: true
    },
    COMPLETED: {
        text: "Gyártás befejezve",
        style: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        icon: CheckCircle2,
        isAction: false
    },
    CANCELLED: {
        text: "Megszakítva",
        style: "bg-slate-800 border-slate-700 text-slate-400",
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