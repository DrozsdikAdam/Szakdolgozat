import type { SelectFieldProps } from "../../../types/input/InputFieldProps"

export const SelectField = ({ label, error, options, placeholderOption, ...props }: SelectFieldProps) => {
    return (
        <div>
            {label && <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>}
            <select
                {...props}
                value={props.value}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-(--cud-skyblue) focus:ring-2 focus:ring-(--cud-skyblue)/20 text-sm transition-all"
            >
                {placeholderOption && <option value="">{placeholderOption}</option>}
                {options?.map(option =>
                    <option key={option.key} value={option.key}>{option.label}</option>
                )}
                {props.children}
            </select>
            {error && <p className="text-cud-vermillon text-xs mt-1">{error}</p>}
        </div>
    )
}