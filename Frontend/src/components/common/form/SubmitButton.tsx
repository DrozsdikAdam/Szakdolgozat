import { LoaderCircle } from "lucide-react"
import type { SubmitButtonProps } from "../../../types/input/SubmitButtonProps"

const variantStyles: Record<string, string> = {
    primary: "bg-(--cud-skyblue) hover:opacity-90 text-slate-950 font-bold shadow-md shadow-(--cud-skyblue)/20 cursor-pointer",
    secondary: "border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer",
    danger: "bg-(--cud-vermillon) hover:opacity-90 text-white font-semibold shadow-md shadow-(--cud-vermillon)/20 cursor-pointer",
    success: "bg-(--cud-teal) hover:opacity-90 text-white font-semibold shadow-md shadow-(--cud-teal)/20 cursor-pointer"
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
