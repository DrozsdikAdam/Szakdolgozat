import { RefreshCw, Zap, Radio } from "lucide-react"
import type { ResilienceHeaderProps } from "../../../types/component/resilience"
import type { ProxyStatus } from "../../../types/resilience"
import { Button } from "../../common/Button"

const getProxyBadgeClass = (isOnline: boolean) => {
    if (isOnline) {
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    }
    return "bg-rose-500/10 text-rose-400 border-rose-500/20"
}

const getProxyDotClass = (isOnline: boolean) => {
    if (isOnline) {
        return "bg-emerald-400 animate-pulse"
    }
    return "bg-rose-400"
}

const getProxyStatusText = (isOnline: boolean) => {
    if (isOnline) {
        return "Proxy Aktív"
    }
    return "Proxy Nem Elérhető"
}

const renderProxyBadge = (proxyStatus: ProxyStatus | null | undefined) => {
    if (!proxyStatus) {
        return null
    }

    const isOnline = Boolean(proxyStatus.available)
    const badgeClass = getProxyBadgeClass(isOnline)
    const dotClass = getProxyDotClass(isOnline)
    const statusText = getProxyStatusText(isOnline)

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${badgeClass}`}
            title={proxyStatus.url}
        >
            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
            <Radio className="w-3.5 h-3.5" />
            <span>{statusText}</span>
        </div>
    )
}

export const ResilienceHeader = ({ proxyStatus, onRefresh, isRefreshing = false }: ResilienceHeaderProps) => {
    const refreshIconClass = isRefreshing ? "animate-spin" : ""

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                    <Zap className="w-6 h-6 text-purple-400 shrink-0" />
                    Reziliencia, Káosztervezés & Terhelésteszt
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    Öngyógyulás (RTO) validáció, Apache JMeter terheléstesztek és NGINX hálózati proxy hibainjektálás.
                </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                {renderProxyBadge(proxyStatus)}

                <Button
                    variant="secondary"
                    size="sm"
                    loading={isRefreshing}
                    icon={<RefreshCw className={`w-4 h-4 ${refreshIconClass}`} />}
                    onClick={onRefresh}
                >
                    Frissítés
                </Button>
            </div>
        </div>
    )
}