import { createPortal } from "react-dom";
import type { NavbarModalProps } from "../../../types/common/ModalProps"
import { X } from "lucide-react";

export const NavbarModal = ({ isOpen, onClose, title, headerRight, bodyClassName, children }: NavbarModalProps) => {

    if (!isOpen) return null;

    return (createPortal(
        <>
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs sm:bg-transparent"
                onClick={() => onClose()}
            />
            <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-800/40">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                        {title}
                    </span>
                    <div className="flex items-center gap-2">
                        {headerRight}
                        <button
                            onClick={() => onClose()}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
                            title="Bezárás"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className={`overflow-y-auto flex-1 ${bodyClassName || "p-3 space-y-3"}`}>
                    {children}
                </div>
            </div>
        </>,
        document.body
    ))
}
