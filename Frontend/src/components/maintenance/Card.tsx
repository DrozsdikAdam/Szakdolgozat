import { Pencil, Trash2 } from "lucide-react";
import type { MaintenanceCardProps } from "../../types/maintenance/MaintenanceProps";
import { MaintenanceStatusBadge, MaintenanceTypeBadge } from "../common/Badges";

export const MaintenanceCard = ({ maintenance, onEdit, onStatusUpdate, onDelete }: MaintenanceCardProps) => {


    return (
        <div className="flex flex-col rounded-2xl p-5 shadow-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl hover:border-slate-700/60 transition-all space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-200">{maintenance.title}</h3>
                <MaintenanceTypeBadge type={maintenance.type} />
                <MaintenanceStatusBadge status={maintenance.status} />
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Kijelölt gép: </p>
                    <p className="text-sm text-slate-400">{maintenance.machineCode} - {maintenance.machineName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Technikus: </p>
                    <p className="text-sm text-slate-400">{maintenance.technicianName || "Nincs felelős"}</p>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                    <p className="text-sm text-slate-400">Leírás: </p>
                    <p className="text-sm text-slate-400">{maintenance.description || "Nincs leírás"}</p>
                </div>
                {maintenance.status === "COMPLETED" && (<>
                    <div className="flex flex-col gap-1.5 pt-1">
                        <p className="text-sm text-slate-400">Hiba oka: </p>
                        <p className="text-sm text-slate-400">{maintenance.rootCause || "Nincs hiba oka"}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                        <p className="text-sm text-slate-400">Elvégzett munka: </p>
                        <p className="text-sm text-slate-400">{maintenance.actionTaken || "Nincs elvégzett munka"}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                        <p className="text-sm text-slate-400">Állásidő: </p>
                        <p className="text-sm text-slate-400">{maintenance.downtimeMinutes ? `${maintenance.downtimeMinutes} perc` : "Nincs állásidő"}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                        <p className="text-sm text-slate-400">Költség: </p>
                        <p className="text-sm text-slate-400">{maintenance.cost ? `${maintenance.cost.toLocaleString("hu-HU")} Ft` : "Nincs költség"}</p>
                    </div>
                </>)}
            </div>
            <div className="flex items-center justify-around">
                <button
                    onClick={() => onEdit(maintenance)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                    <Pencil size={18} />
                </button>
                <button
                    onClick={() => onStatusUpdate(maintenance)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                >
                    Státusz
                </button>
                <button
                    onClick={() => onDelete(maintenance.id)}
                    className={`px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500
                        } text-white font-semibold text-sm transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40`}
                >
                    <Trash2 size={18} />
                    Törlés
                </button>
            </div>
        </div>
    )
}