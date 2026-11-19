import { useState } from "react";
import { Calendar, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CutoverScheduleModalProps } from "../../../types/component/database/cutoverScheduleModalProps";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";
import { Badge } from "../../common/Badge";

export const CutoverScheduleModal = ({
    isOpen,
    onClose,
    targetEngine,
    currentEngine,
    cutoverStatus,
    isScheduling,
    isCancelling,
    onScheduleCutover,
    onCancelCutover
}: CutoverScheduleModalProps) => {
    const isAlreadyScheduled = cutoverStatus?.status === "SCHEDULED";

    const [scheduleMode, setScheduleMode] = useState<"immediate" | "scheduled">("immediate");
    const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 2);
        return tomorrow.toISOString().slice(0, 16);
    });
    const [enableMaintenanceMode, setEnableMaintenanceMode] = useState<boolean>(true);
    const [restartBackend, setRestartBackend] = useState<boolean>(true);

    const handleSubmit = async () => {
        const scheduledAt = scheduleMode === "immediate" ? "immediate" : scheduledDateTime;
        await onScheduleCutover({
            scheduledAt,
            targetEngine,
            enableMaintenanceMode,
            restartBackend
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cud-teal" />
                    <span>Adatbázis Végleges Átállás (Cutover)</span>
                </div>
            }
            subtitle={`Végleges átváltás a szinkronizált ${targetEngine.toUpperCase()} céladatbázisra a ${currentEngine.toUpperCase()} forrásról.`}
            maxWidth="lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    {isAlreadyScheduled ? (
                        <Button
                            variant="danger"
                            size="md"
                            loading={isCancelling}
                            disabled={isCancelling}
                            onClick={onCancelCutover}
                            icon={<XCircle className="w-4 h-4" />}
                        >
                            Ütemezett Átállás Visszavonása
                        </Button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="md" onClick={onClose} disabled={isScheduling || isCancelling}>
                            Mégse
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            loading={isScheduling}
                            disabled={isScheduling || isCancelling}
                            onClick={handleSubmit}
                            icon={<CheckCircle2 className="w-4 h-4" />}
                        >
                            {scheduleMode === "immediate" ? "Azonnali Átállás Végrehajtása" : "Karbantartási Ablak Mentése"}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-5 py-2">
                {isAlreadyScheduled && (
                    <div className="p-4 rounded-xl bg-cud-skyblue-bg/50 border border-cud-skyblue-border flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-cud-skyblue">
                                Aktív Időzített Átállási Ablak
                            </span>
                            <Badge variant="skyblue" text="BEÜTEMEZVE" pulse={true} />
                        </div>
                        <p className="text-xs text-slate-300">
                            Az átállási folyamat be van ütemezve. Időpont:{" "}
                            <span className="font-mono text-slate-100 font-bold">
                                {cutoverStatus.scheduledAt || "Kijelölt időpontban"}
                            </span>
                        </p>
                        {cutoverStatus.message && (
                            <p className="text-xs text-slate-400 italic">{cutoverStatus.message}</p>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">Átváltás Időzítése</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setScheduleMode("immediate")}
                            className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${scheduleMode === "immediate"
                                    ? "bg-cud-teal-bg/60 border-cud-teal text-slate-100 ring-1 ring-cud-teal"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                                }`}
                        >
                            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-200">
                                <Clock className="w-3.5 h-3.5 text-cud-teal" />
                                Azonnali Átállás
                            </span>
                            <span className="text-[11px] text-slate-400">
                                A forgalom átirányítása és a kapcsolatok átkapcsolása most történik.
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setScheduleMode("scheduled")}
                            className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${scheduleMode === "scheduled"
                                    ? "bg-cud-skyblue-bg/60 border-cud-skyblue text-slate-100 ring-1 ring-cud-skyblue"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                                }`}
                        >
                            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-200">
                                <Calendar className="w-3.5 h-3.5 text-cud-skyblue" />
                                Karbantartási Ablak
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Megadott alacsony forgalmú időpontban (pl. éjjel 02:00) hajtódik végre.
                            </span>
                        </button>
                    </div>
                </div>

                {scheduleMode === "scheduled" && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-300">Karbantartási Dátum és Időpont</label>
                        <input
                            type="datetime-local"
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cud-skyblue"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enableMaintenanceMode}
                            onChange={(e) => setEnableMaintenanceMode(e.target.checked)}
                            className="w-4 h-4 text-cud-teal rounded bg-slate-900 border-slate-700 focus:ring-cud-teal cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">
                                503 Karbantartási Mód Aktiválása az átállási másodpercek alatt
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Megakadályozza a tranzakcióvesztést az adatbázis DNS/Service átkapcsolás pillanatában.
                            </span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={restartBackend}
                            onChange={(e) => setRestartBackend(e.target.checked)}
                            className="w-4 h-4 text-cud-teal rounded bg-slate-900 border-slate-700 focus:ring-cud-teal cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">
                                Backend Workload Újraindítása (Rolling Restart)
                            </span>
                            <span className="text-[11px] text-slate-400">
                                A mikroszolgáltatások automatikusan az új adatbázis kapcsolati sztringgel indulnak újra.
                            </span>
                        </div>
                    </label>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                        Az átállás során a rendszer a végleges szinkronizálást elvégzi, lezárja a régi forrást és élesíti a {targetEngine.toUpperCase()} motort.
                    </span>
                </div>
            </div>
        </Modal>
    );
};
