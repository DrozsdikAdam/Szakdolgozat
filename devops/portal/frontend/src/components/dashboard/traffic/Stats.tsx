import { StatCard } from "../../common/StatCard"
import type { TrafficStatsProps } from "../../../types/component/traffic/trafficStatsProps"
import { Activity, Network, Zap } from "lucide-react"

export const TrafficStats = ({ currentRps, ingressName, namespace, burstMultiplier }: TrafficStatsProps) => {

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                title="Aktuális Küszöbérték"
                value={`${currentRps} RPS`}
                icon={<Activity className="w-5 h-5" />}
                iconBoxClassName="bg-slate-800/80 text-cud-skyblue border border-slate-700/60"
            />
            <StatCard
                title="Védett Ingress"
                value={`${ingressName ?? "mes-ingress"} (${namespace ?? "default"})`}
                icon={<Network className="w-5 h-5" />}
                valueClassName="text-cud-teal"
                iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
            />
            <StatCard
                title="Kéréspuffer (Burst)"
                value={`${burstMultiplier ?? 5}x Puffer`}
                icon={<Zap className="w-5 h-5" />}
                valueClassName="text-cud-purple"
                iconBoxClassName="bg-cud-purple-bg text-cud-purple border border-cud-purple-border"
            />
        </div>
    )
}