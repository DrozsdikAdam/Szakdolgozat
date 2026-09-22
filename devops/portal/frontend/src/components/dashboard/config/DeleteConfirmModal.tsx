import { Trash2, AlertCircle } from "lucide-react";
import type { DeleteConfirmModalProps } from "../../../types/component/config/deleteConfirmModalProps";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";

export const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    name,
    namespace,
    isSecret,
    isDeleting = false,
}: DeleteConfirmModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${isSecret ? "Secret" : "ConfigMap"} Törlése`}
            subtitle="Biztosan el kívánod távolítani ezt az erőforrást a klaszterből?"
            icon={<Trash2 className="w-5 h-5 text-cud-vermillon" />}
            maxWidth="md"
            footer={
                <div className="px-5 py-3 flex items-center justify-end gap-3">
                    <Button variant="secondary" size="md" onClick={onClose} disabled={isDeleting}>
                        Mégse
                    </Button>
                    <Button
                        variant="danger"
                        size="md"
                        type="button"
                        onClick={onConfirm}
                        loading={isDeleting}
                        icon={<Trash2 className="w-4 h-4" />}
                    >
                        Végleges törlés
                    </Button>
                </div>
            }
        >
            <div className="p-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-cud-vermillon-bg border border-cud-vermillon-border flex items-start gap-3 text-xs text-cud-vermillon">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <div className="font-semibold mb-1">Figyelem! Ez a művelet visszavonhatatlan.</div>
                        <p className="text-slate-300 leading-relaxed">
                            A(z) <strong className="font-mono text-white">{name}</strong> nevű {isSecret ? "Secret" : "ConfigMap"} azonnal törlődik a(z) <strong className="font-mono text-white">{namespace}</strong> névtérből. Ha léteznek erre hivatkozó konténerek, azok hibára futhatnak.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
