import type { InfoCalloutProps } from "../../types/component/common/infoCalloutProps"
import { Info } from "lucide-react"

export const InfoCallout = ({ title, children, icon, variant = "info", className = "", }: InfoCalloutProps) => {

    const iconColor = {
        info: "text-cud-skyblue",
        warning: "text-cud-orange",
        teal: "text-cud-teal",
    }[variant]

    return (
        <div className={`p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-3 text-xs text-slate-400 leading-relaxed ${className}`}>
            {icon ? (
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>{icon}</div>
            ) : (
                <Info className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            )}
            <div>
                <span className="font-semibold text-slate-300 block mb-0.5">
                    {title}
                </span>
                {children}
            </div>
        </div>
    )
}
