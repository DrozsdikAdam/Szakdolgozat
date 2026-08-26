import { X } from "lucide-react";
import type { ModalProps } from "../../types/Props"
import { SubmitButton } from "./form/SubmitButton"

export const Modal = ({
    isOpen,
    onClose,
    title,
    onSubmit,
    isLoading,
    error,
    submitText = "Mentés",
    submitIcon,
    cancelText = "Mégse",
    maxWidth = "max-w-md",
    children,
    submitVariant = "primary"
}: ModalProps) => {

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full ${maxWidth} bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4`}>
                <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(e); }} className="space-y-3.5">
                    {children}

                    {error && (
                        <p className="text-rose-400 text-xs font-medium text-center pt-1 animate-in fade-in duration-200">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <SubmitButton
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            text={cancelText}
                            className="px-4 py-2 rounded-xl"
                        />
                        <SubmitButton
                            type="submit"
                            loading={isLoading}
                            icon={submitIcon}
                            text={submitText}
                            className="px-5 py-2 rounded-xl"
                            variant={submitVariant}
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}