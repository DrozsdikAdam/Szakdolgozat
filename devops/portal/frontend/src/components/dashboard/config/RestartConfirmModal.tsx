import { RotateCw, AlertTriangle, Layers } from "lucide-react";
import type { RestartConfirmModalProps } from "../../../types/component/config/restartConfirmModalProps";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";

export const RestartConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    namespace,
    workloadNames,
    isRestarting = false,
}: RestartConfirmModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Workloadok Újraindítása"
            subtitle="Gördülő újraindítás kezdeményezése a friss konfigurációs értékek átvételéhez"
            icon={<RotateCw className="w-5 h-5 text-cud-orange" />}
            maxWidth="md"
            footer={
                <div className="px-5 py-3 flex items-center justify-end gap-3">
                    <Button variant="secondary" size="md" onClick={onClose} disabled={isRestarting}>
                        Mégse
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        type="button"
                        onClick={onConfirm}
                        loading={isRestarting}
                        icon={<RotateCw className="w-4 h-4" />}
                    >
                        Újraindítás végrehajtása
                    </Button>
                </div>
            }
        >
            <div className="p-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-cud-orange-bg border border-cud-orange-border flex items-start gap-3 text-xs text-cud-orange">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <div className="font-semibold mb-1">Gördülő (Rolling) Újraindítás</div>
                        <p className="text-slate-300 leading-relaxed">
                            A kiválasztott deploymentek podjai egymás után, leállás nélkül frissülnek. Az új podok már a legfrissebb környezeti változókat és titkokat fogják használni.
                        </p>
                    </div>
                </div>

                <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Érintett deploymentek ({namespace} névtér):
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {workloadNames.map((name) => (
                            <div
                                key={name}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
                            >
                                <Layers className="w-3.5 h-3.5 text-cud-skyblue" />
                                <span>{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
