import { Search } from "lucide-react"
import type { SearchInputProps } from "../../types/component/SerchImputProps"

export const SearchInput = ({ value, onChange, placeholder = "Keresés...", className = "" }: SearchInputProps) => {
    return (
        <>
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cud-skyblue/50"
                    />
                </div>
            </div>
        </>
    )
}