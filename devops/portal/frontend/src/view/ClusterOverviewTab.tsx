import { useState, useEffect, useMemo } from "react"
import { Activity, Box, RefreshCw, Server } from "lucide-react"
import { K8sApi } from "../client/api/k8s"
import type { ClusterOverviewDto, K8sEventDto } from "../types/k8s"
import type { SegmentedControlOption } from "../types/component/common/segmentedControlProps"
import { Button } from "../components/common/Button"
import { SearchInput } from "../components/common/SearchInput"
import { SegmentedControl } from "../components/common/SegmentedControl"
import { ClusterStats } from "../components/dashboard/cluster/ClusterStats"
import { PodTable } from "../components/dashboard/cluster/PodTable"
import { PodLogModal } from "../components/dashboard/cluster/PodLogModal"
import { ClusterEventsTable } from "../components/dashboard/cluster/ClusterEventsTable"
import type { PodTableItem } from "../types/component/cluster/podTableProps"

interface ClusterOverviewTabProps {
    initialView?: "pods" | "events"
}

export const ClusterOverviewTab = ({ initialView = "pods" }: ClusterOverviewTabProps) => {
    const [viewMode, setViewMode] = useState<"pods" | "events">(initialView)
    const [data, setData] = useState<ClusterOverviewDto | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"all" | "app" | "platform">("all")

    const [events, setEvents] = useState<K8sEventDto[]>([])
    const [eventsLoading, setEventsLoading] = useState<boolean>(false)
    const [eventsSearch, setEventsSearch] = useState<string>("")

    const [selectedLogPod, setSelectedLogPod] = useState<PodTableItem | null>(null)

    const k8sApi = useMemo(() => new K8sApi(), [])

    const loadClusterData = () => {
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
    }

    const loadEventsData = () => {
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
    }

    useEffect(() => {
        loadClusterData()
        loadEventsData()
    }, [])

    const allPods: PodTableItem[] = useMemo(() => {
        const apps: PodTableItem[] = (data?.appPods || []).map((p) => ({ ...p, source: "app" }))
        const platforms: PodTableItem[] = (data?.platformPods || []).map((p) => ({
            ...p,
            source: "platform"
        }))
        return [...apps, ...platforms]
    }, [data])

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

    const viewModeOptions: SegmentedControlOption<"pods" | "events">[] = [
        {
            id: "pods",
            label: "Podok",
            count: allPods.length,
            icon: <Box className="w-3.5 h-3.5" />,
            variant: "skyblue"
        },
        {
            id: "events",
            label: "Klaszter Események",
            count: events.length,
            icon: <Activity className="w-3.5 h-3.5" />,
            variant: "skyblue"
        }
    ]

    const podTabOptions: SegmentedControlOption<"all" | "app" | "platform">[] = [
        { id: "all", label: "Összes", count: allPods.length, variant: "skyblue" },
        { id: "app", label: "App Podok", count: data?.appPods?.length || 0, variant: "skyblue" },
        { id: "platform", label: "Platform", count: data?.platformPods?.length || 0, variant: "skyblue" }
    ]

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <Server className="w-6 h-6 text-cud-skyblue" />
                        Klaszter és Pod Áttekintés
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Kubernetes workloadok, pod állapotok, konténer naplók és életesemények valós időben.
                        {data?.timestamp && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {new Date(data.timestamp).toLocaleTimeString()})
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <SegmentedControl<"pods" | "events">
                        value={viewMode}
                        onChange={setViewMode}
                        options={viewModeOptions}
                        layout="pill"
                    />

                    <Button
                        variant="secondary"
                        size="sm"
                        loading={viewMode === "pods" ? loading : eventsLoading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={viewMode === "pods" ? loadClusterData : loadEventsData}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>

            <ClusterStats
                totalPods={allPods.length}
                runningPods={runningCount}
                totalRestarts={totalRestarts}
            />

            {viewMode === "pods" && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Pod keresése név alapján..."
                            className="w-full sm:w-80"
                        />

                        <SegmentedControl<"all" | "app" | "platform">
                            value={activeTab}
                            onChange={setActiveTab}
                            options={podTabOptions}
                            layout="grid"
                        />
                    </div>

                    <PodTable
                        pods={filteredPods}
                        loading={loading}
                        searchQuery={search}
                        onViewLogs={(pod) => setSelectedLogPod(pod)}
                    />
                </div>
            )}

            {viewMode === "events" && (
                <ClusterEventsTable
                    events={events}
                    loading={eventsLoading}
                    onRefresh={loadEventsData}
                    searchQuery={eventsSearch}
                    onSearchChange={setEventsSearch}
                />
            )}

            {selectedLogPod && (
                <PodLogModal
                    pod={selectedLogPod}
                    onClose={() => setSelectedLogPod(null)}
                />
            )}
        </div>
    )
}
