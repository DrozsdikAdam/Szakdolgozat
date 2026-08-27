import { Plus, Search } from "lucide-react";
import type { MaintenanceFilterBarProps } from "../../types/maintenance/MaintenanceProps";
import type { MaintenanceStatus, MaintenanceType } from "../../types/maintenance/MaintenanceStatus";
import { STATUS_OPTIONS } from "../../constants/maintenanceStatus";
import { TYPE_OPTIONS } from "../../constants/maintenanceType";

export const FilterBar = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, typeFilter, setTypeFilter, onCreate }: MaintenanceFilterBarProps) => {

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64 lg:w-72">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text"
                        placeholder="Keresés - cím, gépkód, technikus..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium text-slate-400 whitespace-nowrap">Státusz:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | "ALL")}
                        className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                        <option value="ALL">Mindegyik</option>
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status.key} value={status.key}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium text-slate-400 whitespace-nowrap">Típus:</span>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as MaintenanceType | "ALL")}
                        className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                        <option value="ALL">Mindegyik</option>
                        {TYPE_OPTIONS.map((type) => (
                            <option key={type.key} value={type.key}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            <button
                onClick={onCreate}
                className="w-full lg:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
                <Plus size={18} />
                <span>Új karbantartás</span>
            </button>
        </div>
    )
}