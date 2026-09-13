import { Layers } from "lucide-react"
import type { ServiceFilter, ServiceGridProps } from "../../types/component/service/serviceGridProps"
import { ServiceCard } from "./card"
import { useMemo, useState } from "react"
import { SearchInput } from "../common/SearchInput"
import { EmptyState } from "../common/EmptyState"

export const ServiceGrid = ({ services, onSelectService, selectedServiceId }: ServiceGridProps) => {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [activeFilter, setActiveFilter] = useState<ServiceFilter>("all")

    const filteredServices = useMemo(() => {
        return services.filter((s) => {
            const matchesSearch =
                s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesFilter =
                activeFilter === "all" ||
                (s.isConfigured && activeFilter === "configured") ||
                (!s.isConfigured && activeFilter === "pending")
            return matchesSearch && matchesFilter
        })
    }, [services, searchQuery, activeFilter])

    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Szolgáltatás keresése..."
                    className="w-full sm:w-80"
                />

                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        className={`w-full sm:w-38 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200 cursor-pointer ${activeFilter === "all"
                            ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        onClick={() => setActiveFilter("all")}
                    >
                        Összes ({services.length})
                    </button>
                    <button
                        type="button"
                        className={`w-full sm:w-38 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200 cursor-pointer ${activeFilter === "configured"
                            ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        onClick={() => setActiveFilter("configured")}
                    >
                        Aktív & Üzemkész
                    </button>
                    <button
                        type="button"
                        className={`w-full sm:w-38 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200 cursor-pointer ${activeFilter === "pending"
                            ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        onClick={() => setActiveFilter("pending")}
                    >
                        Beállítás szükséges
                    </button>
                </div>
            </div>

            {filteredServices.length === 0 && (
                <EmptyState
                    icon={<Layers className="w-8 h-8" />}
                    title="Nincs a keresésnek megfelelő szolgáltatás"
                    description="Próbálj meg más keresőkifejezést megadni, vagy válts az 'Összes' szűrőre!"
                />
            )}

            {filteredServices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((s) => (
                        <ServiceCard
                            key={s.id}
                            service={s}
                            isSelected={s.id === selectedServiceId}
                            onSelect={onSelectService}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}