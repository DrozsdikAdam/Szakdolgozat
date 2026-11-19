import { Flame, Gauge, Network, Timer } from "lucide-react"
import type { ResilienceKpiCardsProps } from "../../../types/component/resilience"
import { StatCard } from "../../common/StatCard"
import { Skeleton } from "../../common/Skeleton"

const getRtoColorClass = (averageRtoSeconds: number): string => {
    if (averageRtoSeconds <= 0) {
        return "text-slate-400"
    }
    if (averageRtoSeconds <= 15) {
        return "text-emerald-400"
    }
    if (averageRtoSeconds <= 30) {
        return "text-amber-400"
    }
    return "text-rose-400"
}

const getRtoText = (averageRtoSeconds: number): string => {
    if (averageRtoSeconds <= 0) {
        return "N/A"
    }
    return `${averageRtoSeconds} mp`
}

const getActiveLoadTestsColorClass = (activeLoadTestsCount: number): string => {
    if (activeLoadTestsCount > 0) {
        return "text-sky-400"
    }
    return "text-slate-100"
}

const getProxyStatusLabel = (isAvailable: boolean): string => {
    if (!isAvailable) {
        return "Nem elérhető"
    }
    return "Elérhető"
}

const getProxyStatusColorClass = (isAvailable: boolean): string => {
    if (!isAvailable) {
        return "text-rose-400"
    }
    return "text-emerald-400"
}

const getProxyIconBoxClass = (isAvailable: boolean): string => {
    if (!isAvailable) {
        return "bg-rose-500/10 border border-rose-500/20"
    }
    return "bg-purple-500/10 border border-purple-500/20"
}

const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
            </div>
        ))}
    </div>
)

export const ResilienceKpiCards = ({
    averageRtoSeconds,
    activeLoadTestsCount,
    totalTestsCount,
    recentExperimentsCount,
    proxyAvailable,
    isLoading = false
}: ResilienceKpiCardsProps) => {
    if (isLoading) {
        return renderSkeleton()
    }

    const rtoColorClass = getRtoColorClass(averageRtoSeconds)
    const rtoText = getRtoText(averageRtoSeconds)
    const activeTestsColorClass = getActiveLoadTestsColorClass(activeLoadTestsCount)
    const proxyStatusLabel = getProxyStatusLabel(proxyAvailable)
    const proxyStatusColorClass = getProxyStatusColorClass(proxyAvailable)
    const proxyIconBoxClass = getProxyIconBoxClass(proxyAvailable)

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Átlagos RTO (Öngyógyulás)"
                value={rtoText}
                valueClassName={rtoColorClass}
                icon={<Timer className="w-5 h-5 text-emerald-400" />}
                iconBoxClassName="bg-emerald-500/10 border border-emerald-500/20"
            />

            <StatCard
                title="Aktív / Összes Teszt"
                value={`${activeLoadTestsCount} / ${totalTestsCount}`}
                valueClassName={activeTestsColorClass}
                icon={<Gauge className="w-5 h-5 text-sky-400" />}
                iconBoxClassName="bg-sky-500/10 border border-sky-500/20"
            />

            <StatCard
                title="Káosz Kísérletek"
                value={`${recentExperimentsCount} lefutott`}
                valueClassName="text-slate-100"
                icon={<Flame className="w-5 h-5 text-rose-400" />}
                iconBoxClassName="bg-rose-500/10 border border-rose-500/20"
            />

            <StatCard
                title="Hibatűrő Proxy"
                value={proxyStatusLabel}
                valueClassName={proxyStatusColorClass}
                icon={<Network className="w-5 h-5 text-purple-400" />}
                iconBoxClassName={proxyIconBoxClass}
            />
        </div>
    )
}
