import { AlertTriangle, Calendar, Database, HardDrive, RotateCcw, X } from "lucide-react"
import type { RestoreModalProps } from "../../../types/component/backup/restoreModalProps"
import { Button } from "../../common/Button"

export const RestoreModal = ({ isOpen, backup, isLoading, onConfirm, onClose }: RestoreModalProps) => {

    if (!isOpen || !backup)
        return null


    const formattedSize = `${(backup.size / (1024 * 1024)).toFixed(2)} MB`
    const formattedDate = new Date(backup.createdAt).toLocaleString("hu-HU")

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => !isLoading && onClose()}
        >
            <div
                className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-cud-vermillon-bg text-cud-vermillon border border-cud-vermillon-border shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-100">
                                Adatbázis Helyreállítása (Restore)
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Katasztrófa-helyreállítási művelet megerősítése
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800/60 disabled:opacity-50 cursor-pointer"
                        aria-label="Bezárás"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="bg-cud-vermillon-bg/40 border border-cud-vermillon-border/60 rounded-xl p-3.5 text-xs text-cud-vermillon leading-relaxed">
                        <span className="font-semibold block mb-0.5">Figyelem!</span>
                        A visszaállítási folyamat felülírja a jelenlegi éles adatbázis tartalmát a kiválasztott mentés adataival. A művelet nem visszavonható!
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800/40 pb-2">
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <Database className="w-4 h-4 text-cud-skyblue" />
                                Archívum fájl:
                            </span>
                            <span className="font-mono text-slate-200 font-medium truncate max-w-60" title={backup.filename}>
                                {backup.filename}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-b border-slate-800/40 pb-2">
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <HardDrive className="w-4 h-4 text-cud-purple" />
                                Tömörített méret:
                            </span>
                            <span className="text-slate-200 font-medium">
                                {formattedSize}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-cud-teal" />
                                Mentés időpontja:
                            </span>
                            <span className="text-slate-200 font-medium">
                                {formattedDate}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Mégse
                    </Button>

                    <Button
                        variant="danger"
                        size="md"
                        loading={isLoading}
                        onClick={onConfirm}
                        icon={<RotateCcw className="w-4 h-4" />}
                    >
                        Visszaállítás Indítása
                    </Button>
                </div>
            </div>
        </div>
    )
}
