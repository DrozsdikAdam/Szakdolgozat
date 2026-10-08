import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { K8sApi } from "../client/api/k8s"
import type { ClusterOverviewDto, K8sEventDto } from "../types/k8s"
import type { ClusterViewMode } from "../types/cluster"
import type { PodTableItem } from "../types/component/cluster/podTableProps"
import type { SelectOption } from "../types/component/common/selectProps"
import { createClusterViewOptions, createPodSourceOptions } from "../constants/cluster"

export const useClusterOverview = (initialView: ClusterViewMode = "pods") => {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryTab = searchParams.get("tab") as ClusterViewMode | null
    const [viewMode, setViewMode] = useState<ClusterViewMode>(queryTab || initialView)

    const [data, setData] = useState<ClusterOverviewDto | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"all" | "app" | "platform">("all")

    const [events, setEvents] = useState<K8sEventDto[]>([])
    const [eventsLoading, setEventsLoading] = useState<boolean>(false)
    const [eventsSearch, setEventsSearch] = useState<string>("")

    const [selectedLogPodName, setSelectedLogPodName] = useState<string>("")
    const [logLines, setLogLines] = useState<string[]>([])
    const [logsLoading, setLogsLoading] = useState<boolean>(false)
    const [logSearch, setLogSearch] = useState<string>("")
    const [logTail, setLogTail] = useState<number>(150)
    const [autoScroll, setAutoScroll] = useState<boolean>(true)
    const [copied, setCopied] = useState<boolean>(false)

    const [selectedModalPod, setSelectedModalPod] = useState<PodTableItem | null>(null)

    const k8sApi = useMemo(() => new K8sApi(), [])

    const handleViewModeChange = useCallback((mode: ClusterViewMode) => {
        setViewMode(mode)
        setSearchParams({ tab: mode })
    }, [setSearchParams])

    const loadClusterData = useCallback(() => {
        setLoading(true)
        k8sApi
            .getOverview()
            .then((res) => {
                setData(res)
            })
            .catch((err) => {
                console.warn("Nem sikerült lekérni a klaszter adatokat:", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [k8sApi])

    const loadEventsData = useCallback(() => {
        setEventsLoading(true)
        k8sApi
            .getEvents()
            .then((res) => {
                setEvents(res || [])
            })
            .catch((err) => {
                console.warn("Nem sikerült lekérni a klaszter eseményeket:", err)
            })
            .finally(() => {
                setEventsLoading(false)
            })
    }, [k8sApi])

    useEffect(() => {
        loadClusterData()
        loadEventsData()
    }, [loadClusterData, loadEventsData])

    useEffect(() => {
        if (queryTab && ["pods", "events", "logs"].includes(queryTab)) {
            setViewMode(queryTab)
        }
    }, [queryTab])

    const allPods: PodTableItem[] = useMemo(() => {
        const apps: PodTableItem[] = (data?.appPods || []).map((p) => ({ ...p, source: "app" }))
        const platforms: PodTableItem[] = (data?.platformPods || []).map((p) => ({
            ...p,
            source: "platform"
        }))
        return [...apps, ...platforms]
    }, [data])

    useEffect(() => {
        if (!selectedLogPodName && allPods.length > 0) {
            setSelectedLogPodName(allPods[0].name)
        }
    }, [allPods, selectedLogPodName])

    const currentSelectedPod = useMemo(() => {
        return allPods.find(p => p.name === selectedLogPodName) || allPods[0] || null
    }, [allPods, selectedLogPodName])

    const fetchLogsForSelected = useCallback(async () => {
        if (!currentSelectedPod) return
        setLogsLoading(true)
        const ns = currentSelectedPod.namespace || (currentSelectedPod.source === "app" ? "app-mes" : "platform-infra")
        try {
            const result = await k8sApi.getPodLogs(ns, currentSelectedPod.name, logTail)
            setLogLines(result.lines || [])
        } catch {
            setLogLines(["[ERROR] Nem sikerült kapcsolatot létesíteni a pod naplófájljával."])
        } finally {
            setLogsLoading(false)
        }
    }, [currentSelectedPod, logTail, k8sApi])

    useEffect(() => {
        if (viewMode === "logs" && currentSelectedPod) {
            fetchLogsForSelected()
        }
    }, [viewMode, currentSelectedPod, fetchLogsForSelected])

    const filteredPods = useMemo(() => {
        return allPods.filter((pod) => {
            const matchesTab =
                activeTab === "all" ||
                (activeTab === "app" && pod.source === "app") ||
                (activeTab === "platform" && pod.source === "platform")

            const matchesSearch = pod.name.toLowerCase().includes(search.toLowerCase())
            return matchesTab && matchesSearch
        })
    }, [allPods, activeTab, search])

    const runningCount = useMemo(() => {
        return allPods.filter((p) => p.status.toLowerCase() === "running").length
    }, [allPods])

    const totalRestarts = useMemo(() => {
        return allPods.reduce((sum, p) => sum + (p.restarts || 0), 0)
    }, [allPods])

    const viewModeOptions = useMemo(() => {
        return createClusterViewOptions(allPods.length, events.length)
    }, [allPods.length, events.length])

    const podTabOptions = useMemo(() => {
        return createPodSourceOptions(allPods.length, data?.appPods?.length || 0, data?.platformPods?.length || 0)
    }, [allPods.length, data?.appPods?.length, data?.platformPods?.length])

    const podSelectOptions: SelectOption<string>[] = useMemo(() => {
        return allPods.map((p) => ({
            value: p.name,
            label: `${p.name} (${p.namespace || (p.source === "app" ? "app-mes" : "platform-infra")})`
        }))
    }, [allPods])

    const handleCopyLogs = useCallback(() => {
        navigator.clipboard.writeText(logLines.join("\n"))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [logLines])

    const handleRefresh = useCallback(() => {
        if (viewMode === "pods") {
            loadClusterData()
        } else if (viewMode === "events") {
            loadEventsData()
        } else {
            fetchLogsForSelected()
        }
    }, [viewMode, loadClusterData, loadEventsData, fetchLogsForSelected])

    const isCurrentLoading = viewMode === "pods" ? loading : viewMode === "events" ? eventsLoading : logsLoading

    return {
        viewMode,
        handleViewModeChange,
        viewModeOptions,
        data,
        loading,
        loadClusterData,
        search,
        setSearch,
        activeTab,
        setActiveTab,
        podTabOptions,
        allPods,
        filteredPods,
        runningCount,
        totalRestarts,
        events,
        eventsLoading,
        eventsSearch,
        setEventsSearch,
        loadEventsData,
        selectedLogPodName,
        setSelectedLogPodName,
        podSelectOptions,
        logLines,
        logsLoading,
        logSearch,
        setLogSearch,
        logTail,
        setLogTail,
        autoScroll,
        setAutoScroll,
        copied,
        handleCopyLogs,
        fetchLogsForSelected,
        selectedModalPod,
        setSelectedModalPod,
        handleRefresh,
        isCurrentLoading
    }
}
