import { Loader2 } from "lucide-react";
import type { ButtonProps, ButtonSize, Buttonvariant } from "../../types/component/buttonProps";

export const Button = ({ variant = 'primary', size = 'md', loading = false, icon, children, className = '', type = 'button', disabled = false, ...restProps }: ButtonProps) => {

    const ButtonVariant: Record<Buttonvariant, string> = {
        primary: "bg-cud-skyblue text-slate-950 hover:bg-cud-skyblue/85 font-semibold shadow-sm",
        secondary: "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700",
        danger: "bg-cud-vermillon hover:bg-cud-vermillon/85 text-white",
        ghost: "text-slate-300 hover:text-white hover:bg-slate-800/60"
    }

    const sizeStyles: Record<ButtonSize, string> = {
        sm: "text-xs px-2.5 py-1.5 gap-1.5",
        md: "text-sm px-3.5 py-2 gap-2",
        lg: "text-base px-5 py-2.5 gap-2.5"
    }

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`${ButtonVariant[variant]} ${sizeStyles[size]} inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cud-skyblue/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...restProps}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {!loading && icon && <span className="shrink-0">{icon}</span>}
            {children}
        </button>
    )
}