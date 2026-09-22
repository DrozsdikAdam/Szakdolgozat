import type { SliderProps } from "../../types/component/common/sliderProps"

export const Slider = ({ value, min, max, step = 1, onChange, marks, accentColor = 'skyblue', disabled = false, ariaLabel = "Csúszka", className = "", }: SliderProps) => {

    const accentClass = {
        skyblue: "accent-cud-skyblue",
        teal: "accent-cud-teal",
        purple: "accent-cud-purple",
        orange: "accent-cud-orange",
    }[accentColor]

    const textHighlightClass = {
        skyblue: "text-cud-skyblue font-bold",
        teal: "text-cud-teal font-bold",
        purple: "text-cud-purple font-bold",
        orange: "text-cud-orange font-bold",
    }[accentColor]

    return (
        <div className={`flex flex-col gap-1 pt-1 ${className}`}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={disabled}
                className={`w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all disabled:opacity-50 ${accentClass}`}
                aria-label={ariaLabel}
            />

            {marks && marks.length > 0 && (
                <div className="relative w-full h-5 text-xs text-slate-500 font-mono select-none mt-1">
                    {marks.map((mark) => {
                        const percent = ((mark.value - min) / (max - min)) * 100
                        const isAtStart = mark.value === min
                        const isAtEnd = mark.value === max
                        const transform = isAtStart
                            ? "translateX(0%)"
                            : isAtEnd
                                ? "translateX(-100%)"
                                : "translateX(-50%)"

                        const isSelected = value === mark.value

                        return (
                            <button
                                key={mark.value}
                                type="button"
                                onClick={() => onChange(mark.value)}
                                disabled={disabled}
                                style={{ left: `${percent}%`, transform }}
                                className={`absolute top-0 cursor-pointer transition-colors hover:text-slate-200 focus:outline-none ${isSelected ? textHighlightClass : "text-slate-500"
                                    }`}
                            >
                                {mark.label}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
