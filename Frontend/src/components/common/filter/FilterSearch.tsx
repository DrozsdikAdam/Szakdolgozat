import type { FilterSearchProps } from "../../../types/filter/FilterProps"
import { Search, X } from "lucide-react"

export const FilterSearch = ({ value, onChange, placeholder, className, icon }: FilterSearchProps) => {
    return (
        <div className={`relative lg:w-72 flex items-center gap-2 w-full sm:w-auto ${className}`}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                {icon || <Search className=" h-4 w-4 text-slate-400" />}
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-10 py-2 flex-1 min-w-0  bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-(--cud-skyblue-border) focus:border-(--cud-skyblue) transition-all duration-200 text-sm"
            />
            {value && (
                <button onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 cursor-pointer">
                    <X className=" h-5 w-5 text-slate-400 hover:text-slate-200 transition-all duration-200 hover:scale-110" />
                </button>
            )}
        </div>
    )
}