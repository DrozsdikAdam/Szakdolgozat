import { useState } from "react"
import type { PasswordFieldProps } from "../../../types/input/InputFieldProps"
import { Eye, EyeOff } from "lucide-react"

export const PasswordField = ({ label, error, ...props }: PasswordFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const toggleShowPassword = () => setShowPassword(!showPassword);
    const inputType = showPassword ? "text" : "password";

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={props.id} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
            <div className="relative">
                <input
                    type={inputType}
                    {...props}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    )
}