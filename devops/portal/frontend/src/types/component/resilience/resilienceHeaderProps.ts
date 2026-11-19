import type { ProxyStatus } from "../../resilience"

export interface ResilienceHeaderProps {
    proxyStatus?: ProxyStatus | undefined
    onRefresh: () => void
    isRefreshing?: boolean | undefined
}