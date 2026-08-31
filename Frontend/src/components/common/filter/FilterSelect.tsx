import type { FilterSelectProps } from "../../../types/filter/FilterProps"

export const FilterSelect = ({ label, value, onChange, options, allOptionsLabel, placeholder, disabled, className }: FilterSelectProps) => {
    return (
        <div className={`flex items-center gap-2 w-full sm:w-auto ${className}`}>
            {label && <label className="text-sm font-medium text-slate-400 whitespace-nowrap">{label}</label>}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 text-sm"
                disabled={disabled}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {allOptionsLabel && <option value="ALL">{allOptionsLabel}</option>}
                {options.map((option) => (
                    <option key={option.key} value={option.key}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}