export interface ResilienceKpiCardsProps {
    averageRtoSeconds: number
    activeLoadTestsCount: number
    totalTestsCount: number
    recentExperimentsCount: number
    proxyAvailable: boolean
    isLoading?: boolean | undefined
}