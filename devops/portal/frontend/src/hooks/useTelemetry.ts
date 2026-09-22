import { useEffect, useMemo, useState } from "react"
import type { TelemetryOverViewDto, TelemetryTimeRange } from "../types/telemetry"
import type { ToastMessage } from "./useHealthchecks";
import { TelemetryApiClient } from "../client/api/telemetry";

export const useTelemetry = () => {
    const [overView, setOverView] = useState<TelemetryOverViewDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
    const [timeRange, setTimeRange] = useState<TelemetryTimeRange>('1h')
    const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
    const [activeDashboardId, setActiveDashboardId] = useState<string>("cluster-overview")
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)

    const api = useMemo(() => {
        return new TelemetryApiClient()
    }, [])

    const loadData = async (silent?: boolean) => {
        setIsLoading(!silent)
        setIsRefreshing(true)
        try {
            const response: TelemetryOverViewDto = await api.getOverview(timeRange)
            setOverView(response)
        } catch (error) {
            setToastMessage({ text: "Hiba a grafikonok betöltése közben", type: "error" })
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        const interval = setInterval(() => {
            loadData(true)
        }, 30000);
        loadData()
        return () => clearInterval(interval)
    }, [timeRange])


    const filteredWorkloads = useMemo(() => {
        if (!overView) return []
        if (selectedNamespace === "all") return overView.workloads
        return overView.workloads.filter((workload) => workload.namespace === selectedNamespace)
    }, [overView, selectedNamespace])

    return {
        overView,
        filteredWorkloads,
        sources: overView?.sources ?? {},
        signals: overView?.signals ?? null,
        cluster: overView?.cluster ?? null,
        dashboards: overView?.dashboards ?? [],
        isLoading,
        isRefreshing,
        timeRange,
        selectedNamespace,
        activeDashboardId,
        toastMessage,
        setTimeRange,
        setSelectedNamespace,
        setActiveDashboardId,
        refresh: () => loadData(false)
    }
}