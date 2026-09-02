import { Plus } from "lucide-react"
import type { FilterBarProps } from "../../types/product/ProductProps";
import { FilterSearch } from "../common/filter/FilterSearch";
import { SubmitButton } from "../common/form/SubmitButton";
import { Can } from "../common/Can";

export const FilterBar = ({ activeTab, searchTerm, setSearchTerm, setActiveTab, openModal }: FilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
            <FilterSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Cikkszám, név keresése..."
            />

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
            <Can roles={["SYSTEMADMIN", "MANAGER"]}>
                <SubmitButton
                    onClick={() => openModal(null)}
                    text="Új termék"
                    icon={<Plus size={18} />}
                    className="px-5 py-2.5 rounded-xl cursor-pointer"
                />
            </Can>
        </div>
    )
}