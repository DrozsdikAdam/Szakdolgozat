import { useEffect } from "react"
import { X } from "lucide-react"
import type { ModalProps } from "../../types/component/common/modalProps"

export const Modal = ({
    isOpen = true,
    onClose,
    title,
    subtitle,
    icon,
    headerExtra,
    children,
    footer,
    maxWidth = "5xl",
    className = ""
}: ModalProps) => {
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl"
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className={`w-full ${maxWidthClasses[maxWidth]} h-[88vh] max-h-212.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ${className}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {icon && (
                            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-cud-skyblue shrink-0">
                                {icon}
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-bold text-slate-100 truncate font-mono">
                                    {title}
                                </h2>
                                {headerExtra}
                            </div>
                            {subtitle && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Bezárás (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {children}
                </div>

                {footer && (
                    <div className="shrink-0 border-t border-slate-800 bg-slate-900/90">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
