import { useState } from "react"
import type { InputProps } from "../../types/component/common/inputProps"
import { Eye, EyeOff } from "lucide-react"

export const Input = ({ label, icon, helperText, error, value, onChange, type = "text", placeholder, disabled = false, accentColor = "teal", className = "", }: InputProps) => {
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === "password"
    const inputType = isPassword ? (showPassword ? "text" : "password") : type

    const ringColors = {
        teal: "focus:ring-cud-teal/60 focus:border-cud-teal/40",
        skyblue: "focus:ring-cud-skyblue/60 focus:border-cud-skyblue/40",
        orange: "focus:ring-cud-orange/60 focus:border-cud-orange/40",
        purple: "focus:ring-cud-purple/60 focus:border-cud-purple/40",
    }

    const iconColors = {
        teal: "text-cud-teal",
        skyblue: "text-cud-skyblue",
        orange: "text-cud-orange",
        purple: "text-cud-purple",
    }

    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    {label}
                </label>
            )}

            <div className="relative w-full">
                {icon && (
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0 ${iconColors[accentColor]} [&>svg]:w-4 [&>svg]:h-4`}>
                        {icon}
                    </div>
                )}

                <input
                    type={inputType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-100 font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${ringColors[accentColor]
                        } ${icon ? "pl-9.5 pr-3.5" : "px-3.5"} ${isPassword ? "pr-10" : ""
                        } ${error ? "border-cud-vermillon/80 focus:ring-cud-vermillon/50" : ""}`}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={disabled}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-0.5 rounded focus:outline-none"
                    >
                        {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>

            {error && (
                <p className="text-xs text-cud-vermillon font-medium mt-0.5">
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                    {helperText}
                </p>
            )}
        </div>
    )
}