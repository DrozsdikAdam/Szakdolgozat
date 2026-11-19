import { StatCard } from "../../common/StatCard"
import type { AutoscalingStatsProps } from "../../../types/component/autoscaling/autoscalingStatsProps"
import { Activity, Cpu, HardDrive, Layers, Sparkles, TrendingUp, Zap } from "lucide-react"

export const AutoscalingStats = ({ strategy, hpa, vpa, isLoading = false, }: AutoscalingStatsProps) => {
    const currentReplicas = hpa?.currentReplicas ?? 2
    const minReplicas = hpa?.minReplicas ?? 1
    const maxReplicas = hpa?.maxReplicas ?? 10
    const targetCpu = hpa?.targetCpuUtil ?? 80
    const measuredCpu = hpa?.currentCpuPercent ?? 45

    const vpaMode = vpa?.updateMode ?? 'Off'
    const isVpaAuto = vpaMode === 'Auto'
    const targetCpuRes = vpa?.targetCpu ?? "250m"
    const targetMemRes = vpa?.targetMemory ?? "512Mi"
    const allowedMem = `${vpa?.minAllowedMemory ?? "128Mi"} - ${vpa?.maxAllowedMemory ?? "2Gi"}`

    if (strategy === 'hpa') {
        return (
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 transition-opacity duration-200 ${isLoading ? "opacity-60 animate-pulse pointer-events-none" : ""}`}>
                <StatCard
                    title="Futó Pod Replikák"
                    value={`${currentReplicas} db aktív`}
                    icon={<Layers className="w-5 h-5" />}
                    valueClassName="text-cud-skyblue"
                    iconBoxClassName="bg-slate-800/80 text-cud-skyblue border border-slate-700/60"
                />

                <StatCard
                    title="Skálázási Korlátok"
                    value={`${minReplicas} – ${maxReplicas} pod`}
                    icon={<Activity className="w-5 h-5" />}
                    valueClassName="text-cud-teal"
                    iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
                />

                <StatCard
                    title="HPA Cél CPU Küszöb"
                    value={`${targetCpu}%`}
                    icon={<Cpu className="w-5 h-5" />}
                    valueClassName="text-cud-teal"
                    iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
                />

                <StatCard
                    title="Jelenlegi Mért Terhelés"
                    value={`~${measuredCpu}% CPU`}
                    icon={<Zap className="w-5 h-5" />}
                    valueClassName="text-cud-orange"
                    iconBoxClassName="bg-cud-orange-bg text-cud-orange border border-cud-orange-border"
                />
            </div>
        )
    }

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 transition-opacity duration-200 ${isLoading ? "opacity-60 animate-pulse pointer-events-none" : ""}`}>
            <StatCard
                title="VPA Működési Mód"
                value={isVpaAuto ? "Auto (Aktív)" : "Off (Megfigyelés)"}
                icon={<TrendingUp className="w-5 h-5" />}
                valueClassName="text-cud-purple"
                iconBoxClassName="bg-cud-purple-bg text-cud-purple border border-cud-purple-border"
            />

            <StatCard
                title="VPA Javasolt CPU"
                value={targetCpuRes}
                icon={<Sparkles className="w-5 h-5" />}
                valueClassName="text-cud-teal"
                iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
            />

            <StatCard
                title="VPA Javasolt RAM"
                value={targetMemRes}
                icon={<HardDrive className="w-5 h-5" />}
                valueClassName="text-cud-orange"
                iconBoxClassName="bg-cud-orange-bg text-cud-orange border border-cud-orange-border"
            />

            <StatCard
                title="Megengedett RAM Keret"
                value={allowedMem}
                icon={<Layers className="w-5 h-5" />}
                valueClassName="text-cud-purple"
                iconBoxClassName="bg-slate-800/80 text-cud-purple border border-slate-700/60"
            />
        </div>
    )
}