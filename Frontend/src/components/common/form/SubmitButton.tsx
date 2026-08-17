import { LoaderCircle } from "lucide-react"
import type { SubmitButtonProps } from "../../../types/input/SubmitButtonProps"

const variantStyles: Record<string, string> = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25",
    secondary: "border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25"
}

export const SubmitButton = ({ loading = false, icon, text, children, variant = "primary", className = "", ...props
}: SubmitButtonProps) => {
    const baseStyle = "font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    const selectedVariant = variantStyles[variant] || variantStyles.primary

    return (
        <button
            type="submit"
            disabled={loading || props.disabled}
            {...props}
            className={`${baseStyle} ${selectedVariant} ${className}`}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <LoaderCircle className="animate-spin h-4 w-4 text-white" size={18} />
                </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    {icon}
                    {text || children}
                </span>
            )}
        </button>
    )
}
