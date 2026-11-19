import { Loader2 } from "lucide-react"
import type { toggleProps } from "../../types/component/features/toggleProps"

const SIZE_CONFIG = {
    sm: {
        button: "w-9 h-5",
        knob: "w-3.5 h-3.5",
        spinner: "w-2.5 h-2.5",
        translate: {
            true: "translate-x-4.5",
            false: "translate-x-0.5"
        }
    },
    md: {
        button: "w-12 h-6",
        knob: "w-4 h-4",
        spinner: "w-3 h-3",
        translate: {
            true: "translate-x-6.5",
            false: "translate-x-1"
        }
    }
} as const

const STATE_STYLES = {
    checked: {
        true: "bg-cud-skyblue border-cud-skyblue/80",
        false: "bg-slate-800/90 border-slate-700/80 hover:border-slate-600"
    },
    interactive: {
        true: "cursor-pointer",
        false: "opacity-50 cursor-not-allowed"
    }
} as const

export const Toggle = ({
    checked,
    onChange,
    disabled = false,
    loading = false,
    size = "md",
    ariaLabel = "Kapcsoló"
}: toggleProps) => {

    const isInteractive = !disabled && !loading
    const checkedKey = String(checked) as "true" | "false"
    const interactiveKey = String(isInteractive) as "true" | "false"
    const currentSize = SIZE_CONFIG[size]

    const handleClick = () => isInteractive && onChange(!checked)

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={!isInteractive}
            onClick={handleClick}
            className={`relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 ease-in-out border focus:outline-none focus-visible:ring-2 focus-visible:ring-cud-skyblue/50 ${currentSize.button} ${STATE_STYLES.checked[checkedKey]} ${STATE_STYLES.interactive[interactiveKey]}`}
        >
            <span className={`inline-flex items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${currentSize.knob} ${currentSize.translate[checkedKey]}`}>
                {loading && <Loader2 className={`animate-spin text-slate-900 ${currentSize.spinner}`} />}
            </span>
        </button>
    )
}
