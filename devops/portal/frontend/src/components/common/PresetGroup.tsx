import type { PresetGroupProps } from "../../types/component/common/presetGroupProps"
import { Zap } from "lucide-react"

export const PresetGroup = <T,>({ title = "Gyors Beállítási Profilok", subtitle = "Ajánlott konfigurációk", options, selectedId, onSelect, columns = 4, accentColor = "skyblue", disabled = false, className = "", }: PresetGroupProps<T>) => {

    const gridColsClass = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-3",
        4: "grid-cols-2 sm:grid-cols-4",
        5: "grid-cols-2 sm:grid-cols-5",
    }[columns]

    const selectedStyleClass = {
        skyblue: "bg-cud-skyblue/10 border-cud-skyblue text-cud-skyblue shadow-lg shadow-cud-skyblue/10",
        teal: "bg-cud-teal/10 border-cud-teal text-cud-teal shadow-lg shadow-cud-teal/10",
        purple: "bg-cud-purple/10 border-cud-purple text-cud-purple shadow-lg shadow-cud-purple/10",
        orange: "bg-cud-orange/10 border-cud-orange text-cud-orange shadow-lg shadow-cud-orange/10",
    }[accentColor]

    const iconColorClass = {
        skyblue: "text-cud-skyblue",
        teal: "text-cud-teal",
        purple: "text-cud-purple",
        orange: "text-cud-orange",
    }[accentColor]

    return (
        <div className={className}>
            {(title || subtitle) && (
                <div className="flex items-center justify-between mb-3">
                    {title && (
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Zap className={`w-4 h-4 ${iconColorClass}`} />
                            {title}
                        </label>
                    )}
                    {subtitle && (
                        <span className="text-xs text-slate-500">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}

            <div className={`grid ${gridColsClass} gap-3`}>
                {options.map((option) => {
                    const isSelected = selectedId === option.id
                    return (
                        <button
                            key={String(option.id)}
                            type="button"
                            onClick={() => onSelect(option)}
                            disabled={disabled}
                            className={`p-3 rounded-xl border text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                                ? selectedStyleClass
                                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold font-mono">
                                    {option.label}
                                </span>
                                {option.badge && (
                                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                        {option.badge}
                                    </span>
                                )}
                            </div>
                            {option.description && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {option.description}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
