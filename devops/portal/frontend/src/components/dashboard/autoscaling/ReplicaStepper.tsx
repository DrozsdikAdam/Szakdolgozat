import type { ReplicaStepperProps } from "../../../types/component/autoscaling/replicaStepperProps"
import { Minus, Plus } from "lucide-react"

export const ReplicaStepper = ({ title, description, value, min, max, unit = "pod", color = "teal", onChange, disabled = false, }: ReplicaStepperProps) => {

    const textColorClass = {
        teal: "text-cud-teal",
        orange: "text-cud-orange",
        skyblue: "text-cud-skyblue",
    }[color]

    const accentClass = {
        teal: "accent-cud-teal",
        orange: "accent-cud-orange",
        skyblue: "accent-cud-skyblue",
    }[color]

    return (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {title}
                </span>
                <span className={`text-lg font-mono font-bold ${textColorClass}`}>
                    {value} {unit}
                </span>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={disabled || value <= min}
                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-200 cursor-pointer transition-colors"
                    aria-label={`${title} csökkentése`}
                >
                    <Minus className="w-4 h-4" />
                </button>

                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className={`flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 ${accentClass}`}
                />

                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={disabled || value >= max}
                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-200 cursor-pointer transition-colors"
                    aria-label={`${title} növelése`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <span className="text-[11px] text-slate-400">
                {description}
            </span>
        </div>
    )
}
