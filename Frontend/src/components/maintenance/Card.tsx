import { Pencil, Trash2, ChevronDown, ChevronUp, Wrench } from "lucide-react";
import type { MaintenanceCardProps } from "../../types/maintenance/MaintenanceProps";
import { MaintenanceStatusBadge, MaintenanceTypeBadge } from "../common/Badges";
import { useState } from "react";
import { Can } from "../common/Can";

export const MaintenanceCard = ({ maintenance, onEdit, onStatusUpdate, onDelete }: MaintenanceCardProps) => {

    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    return (
        <div className="flex flex-col rounded-2xl p-5 shadow-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl hover:border-slate-700/60 transition-all space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-200">{maintenance.title}</h3>
                <div className="flex gap-2">
                    <MaintenanceTypeBadge type={maintenance.type} />
                    <MaintenanceStatusBadge status={maintenance.status} />

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-4 transition-all duration-300 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm shadow-lg shadow-slate-800/25 hover:shadow-slate-700/40"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                </div>
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
                {isExpanded && (
                    <>
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
                    </>
                )}
            </div>
            <div className="flex items-center justify-around">
                <Can roles={["SYSTEMADMIN", "TECHNICIAN"]}>
                    <button
                        onClick={() => onEdit(maintenance)}
                        className="px-4 flex items-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                    >
                        <Pencil size={18} /> Módosítás
                    </button>
                    <button
                        onClick={() => onStatusUpdate(maintenance)}
                        className="px-4 flex items-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                    >
                        <Wrench size={18} /> Státusz
                    </button>
                </Can>
                <Can roles={["SYSTEMADMIN"]}>
                    <button
                        onClick={() => onDelete(maintenance.id)}
                        className={`px-4 flex items-center gap-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500
                         text-white font-semibold text-sm transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40`}
                    >
                        <Trash2 size={18} />
                        Törlés
                    </button>
                </Can>
            </div>
        </div>
    )
}