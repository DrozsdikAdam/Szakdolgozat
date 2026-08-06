import { Plus, Search } from "lucide-react"
import type { FilterBarProps } from "../../types/product/ProductProps";

export const FilterBar = ({ activeTab, searchTerm, setSearchTerm, setActiveTab, openModal }: FilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full lg:w-72">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    type="text"
                    placeholder="Cikkszám, név keresése..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
            </div>

            <div className="flex items-center bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 text-xs sm:text-sm font-medium w-full lg:w-auto justify-center">
                <button onClick={() => setActiveTab("active")} className={`${activeTab === "active" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"} px-4 py-1.5 rounded-lg transition-all`}>
                    Aktív termékek
                </button>
                <button onClick={() => setActiveTab("inactive")} className={`${activeTab === "inactive" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"} px-4 py-1.5 rounded-lg transition-all`}>
                    Inaktív termékek
                </button>
                <button onClick={() => setActiveTab("deleted")} className={`${activeTab === "deleted" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"} px-4 py-1.5 rounded-lg transition-all`}>
                    Törölt termékek
                </button>
            </div>

            <button onClick={() => openModal(null)} className="w-full lg:w-auto py-2 px-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/50">
                <Plus size={18} />
                Új termék
            </button>
        </div>
    )
}