import { AlertTriangle, Trash2 } from "lucide-react";
import type { DeleteConfirmModalProps } from "../../../types/common/ModalProps";
import { Modal } from "./Modal";

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title = "Törlés megerősítése", itemName, message = "Biztosan törölni szeretnéd a kiválasztott elemet? Ez a művelet nem vonható vissza.", isLoading }: DeleteConfirmModalProps) => {

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onConfirm}
            title={title}
            isLoading={isLoading}
            submitText="Igen, törlöm!"
            submitIcon={<Trash2 size={24} />}
            cancelText="Mégse"
            maxWidth="max-w-lg"
            submitVariant="danger"
        >
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <div className="text-left">

                <div className="mb-4">
                    {itemName && (<p className="font-semibold text-gray-300 mb-2">Biztosan törölni szeretné a(z) "{itemName}" elemet?</p>)}
                    <p className="text-gray-200">{message}</p>
                </div>

            </div>
        </Modal >
    )
}