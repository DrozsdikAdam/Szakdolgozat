import type { InputFieldProps } from "../../../types/input/InputFieldProps"

export const InputField = ({ label, error, ...props }: InputFieldProps) => {
    return (
        <div>
            <label htmlFor={props.id} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
            <input type="text" {...props} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-(--cud-skyblue) focus:ring-2 focus:ring-(--cud-skyblue)/20 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
            {error && <p className="text-cud-vermillon text-xs mt-1">{error}</p>}
        </div>
    )
}