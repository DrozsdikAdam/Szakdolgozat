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
        <div className="modal-overlay">
            <div className={`modal-box ${maxWidth} space-y-4`}>
                <div className="modal-header">
                    <h1 className="text-xl font-bold text-main tracking-tight">{title}</h1>
                    <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-secondary hover:bg-slate-800 transition-all">
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