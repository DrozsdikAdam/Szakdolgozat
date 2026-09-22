import { ToggleRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react"
import { StatCard } from "../../common/StatCard"
import type { FeatureStatsProps } from "../../../types/component/features/featureStatsProps"

const MAINTENANCE_CONFIG = {
    true: {
        value: "Karbantartás",
        valueClassName: "text-cud-vermillon",
        iconBoxClassName: "bg-cud-vermillon-bg text-cud-vermillon border border-cud-vermillon-border"
    },
    false: {
        value: "Normál Üzemmenet",
        valueClassName: "text-cud-skyblue",
        iconBoxClassName: "bg-cud-skyblue-bg text-cud-skyblue border border-cud-skyblue-border"
    }
} as const

export const FeatureStats = ({ totalCount, activeCount, maintenanceActive }: FeatureStatsProps) => {
    const maintenanceKey = String(maintenanceActive) as "true" | "false"
    const currentMaintenance = MAINTENANCE_CONFIG[maintenanceKey]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                title="Összes Funkció"
                value={totalCount}
                icon={<ToggleRight className="w-5 h-5" />}
                iconBoxClassName="bg-slate-800/80 text-cud-skyblue border border-slate-700/60"
            />

            <StatCard
                title="Aktív Funkciók"
                value={`${activeCount} / ${totalCount}`}
                valueClassName="text-cud-teal"
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
            />

            <StatCard
                title="Rendszer Üzemmód"
                value={currentMaintenance.value}
                valueClassName={currentMaintenance.valueClassName}
                icon={
                    maintenanceActive ?
                        <AlertTriangle className="w-5 h-5" />
                        :
                        <ShieldCheck className="w-5 h-5" />
                }
                iconBoxClassName={currentMaintenance.iconBoxClassName}
            />
        </div>
    )
}
