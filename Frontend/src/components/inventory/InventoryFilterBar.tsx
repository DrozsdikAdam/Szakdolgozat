import type { InventoryFilterBarProps } from "../../types/inventory/inventoryProps"
import { MapPin, Plus, Search } from "lucide-react"

export const InventoryFilterBar = ({ searchTerm, setSearchTerm, locationFilter, setLocationFilter, openModal }: InventoryFilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64 lg:w-72">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text"
                        placeholder="Cikkszám, név keresése..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                </div>

                <div className="relative w-full sm:w-64 lg:w-72">
                    <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        type="text"
                        placeholder="Raktárhely szűrés..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                </div>
            </div>

            <button onClick={() => openModal()} className="w-full lg:w-auto py-2 px-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/50">
                <Plus size={18} />
                Készlet módosítása
            </button>
        </div>
    )
}