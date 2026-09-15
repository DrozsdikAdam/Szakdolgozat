import { StatCard } from "../../common/StatCard"
import type { AutoscalingStatsProps } from "../../../types/component/autoscaling/autoscalingStatsProps"
import { Cpu, Layers, Sparkles, TrendingUp } from "lucide-react"

export const AutoscalingStats = ({ hpa, vpa, isLoading = false }: AutoscalingStatsProps) => {
    const currentReplicas = hpa?.currentReplicas ?? 2
    const minReplicas = hpa?.minReplicas ?? 1
    const maxReplicas = hpa?.maxReplicas ?? 10

    const targetCpu = hpa?.targetCpuUtil ?? 80
    const measuredCpu = hpa?.currentCpuPercent ?? 45

    const vpaMode = vpa?.updateMode ?? 'Off'
    const isVpaAuto = vpaMode === 'Auto'

    const targetResources = vpa?.targetCpu && vpa?.targetMemory
        ? `${vpa.targetCpu} | ${vpa.targetMemory}`
        : "250m | 512Mi"

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 transition-opacity duration-200 ${isLoading ? "opacity-60 animate-pulse pointer-events-none" : ""}`}>
            <StatCard
                title="Aktuális Pod Replikák"
                value={`${currentReplicas} db (${minReplicas} - ${maxReplicas})`}
                icon={<Layers className="w-5 h-5" />}
                valueClassName="text-cud-skyblue"
                iconBoxClassName="bg-slate-800/80 text-cud-skyblue border border-slate-700/60"
            />

            <StatCard
                title="HPA Cél CPU Küszöb"
                value={`${targetCpu}% (Mért: ~${measuredCpu}%)`}
                icon={<Cpu className="w-5 h-5" />}
                valueClassName="text-cud-teal"
                iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
            />

            <StatCard
                title="VPA Működési Mód"
                value={isVpaAuto ? "Auto (Aktív)" : "Off (Megfigyelés)"}
                icon={<TrendingUp className="w-5 h-5" />}
                valueClassName="text-cud-purple"
                iconBoxClassName="bg-cud-purple-bg text-cud-purple border border-cud-purple-border"
            />

            <StatCard
                title="VPA Ajánlott Erőforrás"
                value={targetResources}
                icon={<Sparkles className="w-5 h-5" />}
                valueClassName="text-cud-orange"
                iconBoxClassName="bg-cud-orange-bg text-cud-orange border border-cud-orange-border"
            />
        </div>
    )
}