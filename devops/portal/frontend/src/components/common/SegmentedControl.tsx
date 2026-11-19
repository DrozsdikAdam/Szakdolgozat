import type { SegmentedControlProps } from "../../types/component/common/segmentedControlProps"

export function SegmentedControl<T extends string>({
    value,
    onChange,
    options,
    size = "sm",
    layout = "pill",
    className = ""
}: SegmentedControlProps<T>) {
    const activeColorClasses = {
        skyblue: "bg-cud-skyblue text-slate-950 font-semibold shadow-sm",
        teal: "bg-cud-teal text-slate-950 font-semibold shadow-sm",
        orange: "bg-cud-orange text-slate-950 font-semibold shadow-sm",
        vermillon: "bg-cud-vermillon text-white font-semibold shadow-sm",
        purple: "bg-cud-purple text-slate-950 font-semibold shadow-sm"
    }

    const sizeClasses = {
        sm: layout === "pill" ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-xs",
        md: layout === "pill" ? "px-4 py-2 text-sm" : "px-4 py-2.5 text-sm"
    }

    if (layout === "grid") {
        return (
            <div className={`grid grid-cols-${options.length} gap-2 w-full sm:w-auto ${className}`}>
                {options.map((opt) => {
                    const isSelected = value === opt.id
                    const variant = opt.variant || "skyblue"
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChange(opt.id)}
                            className={`rounded-lg font-medium text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${sizeClasses[size]} ${
                                isSelected
                                    ? activeColorClasses[variant]
                                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        >
                            {opt.icon}
                            <span>{opt.label}</span>
                            {opt.count !== undefined && (
                                <span className={isSelected ? "opacity-90" : "text-slate-500"}>
                                    ({opt.count})
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        )
    }

    return (
        <div className={`p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1 w-full sm:w-auto ${className}`}>
            {options.map((opt) => {
                const isSelected = value === opt.id
                const variant = opt.variant || "skyblue"
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={`flex items-center gap-1.5 rounded-lg font-semibold transition-all cursor-pointer ${sizeClasses[size]} ${
                            isSelected
                                ? activeColorClasses[variant]
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                    >
                        {opt.icon}
                        <span>{opt.label}</span>
                        {opt.count !== undefined && (
                            <span className={isSelected ? "opacity-90" : "text-slate-500"}>
                                ({opt.count})
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
