import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import type { ServiceCardProps } from "../../types/component/service/serviceCardProps"
import { HOVER_ACCENT_STYLES } from "../../constants/services"
import { Badge } from "../common/Badge"

export const ServiceCard = ({ service, onSelect, isSelected = false }: ServiceCardProps) => {
    if (!service) return null

    const selectedBorder = isSelected
        ? "border-cud-skyblue shadow-[0_0_24px_var(--cud-skyblue-bg)] bg-slate-800/90"
        : "border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/60"

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(service.id)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelect(service.id)
                }
            }}
            className={`group relative flex flex-col justify-between p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-cud-skyblue/50 ${selectedBorder} ${HOVER_ACCENT_STYLES[service.badgeVariant]}`}
        >
            <div>
                <div className="flex items-center justify-between gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/60 text-cud-skyblue shadow-inner transition-colors duration-300 group-hover:border-slate-600 group-hover:text-slate-100">
                        {service.iconName}
                    </div>
                    <Badge
                        variant={service.badgeVariant}
                        text={service.badgeText}
                        pulse={service.isConfigured}
                        size="sm"
                    />
                </div>

                <div className="mt-5">
                    <h3 className="text-lg font-bold text-slate-100 tracking-tight transition-colors duration-200 group-hover:text-cud-skyblue">
                        {service.label}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {service.description}
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                    {service.statusVariant === 'vermillon' ? (
                        <>
                            <AlertCircle className="w-3.5 h-3.5 text-cud-vermillon shrink-0" />
                            <span className="text-cud-vermillon font-semibold">{service.statusLabel || "Kritikus állapot"}</span>
                        </>
                    ) : service.statusVariant === 'orange' || (!service.isConfigured && !service.statusVariant) ? (
                        <>
                            <AlertCircle className="w-3.5 h-3.5 text-cud-orange shrink-0" />
                            <span className="text-slate-300">{service.statusLabel || "Beállítás szükséges"}</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-cud-teal shrink-0" />
                            <span className="text-slate-300">{service.statusLabel || "Aktív & Üzemkész"}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 text-cud-skyblue font-semibold transition-transform duration-200 group-hover:translate-x-1">
                    <span>Megnyitás</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    )
}