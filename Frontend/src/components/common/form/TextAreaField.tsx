import type { TextAreaFieldProps } from "../../../types/input/InputFieldProps"

export const TextAreaField = ({ label, error, ...props }: TextAreaFieldProps) => {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
            <textarea
                {...props}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl resize-none bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-(--cud-skyblue) focus:ring-2 focus:ring-(--cud-skyblue)/20 text-sm transition-all"
            />
            {error && <p className="text-xs text-cud-vermillon mt-1">{error}</p>}
        </div>
    )
}