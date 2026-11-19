import type { SelectProps } from "../../types/component/common/selectProps"

export function Select<T extends string | number>({
    value,
    onChange,
    options,
    title,
    className = "",
    size = "sm",
    disabled = false
}: SelectProps<T>) {
    const sizeClasses = {
        sm: "text-xs px-2.5 py-1",
        md: "text-sm px-3 py-1.5"
    }

    return (
        <select
            value={value}
            onChange={(e) => {
                const targetValue = e.target.value
                const isNumeric = typeof value === "number"
                onChange((isNumeric ? Number(targetValue) : targetValue) as unknown as T)
            }}
            disabled={disabled}
            title={title}
            className={`bg-slate-900 border border-slate-800 text-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cud-skyblue cursor-pointer font-mono transition-colors disabled:opacity-50 ${sizeClasses[size]} ${className}`}
        >
            {options.map((opt) => (
                <option key={String(opt.value)} value={opt.value} className="bg-slate-900 text-slate-200">
                    {opt.label}
                </option>
            ))}
        </select>
    )
}
