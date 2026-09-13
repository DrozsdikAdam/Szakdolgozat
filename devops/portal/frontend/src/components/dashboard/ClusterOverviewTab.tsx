import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Server } from "lucide-react"
import { K8sApi } from "../../client/api/k8s"
import type { ClusterOverviewDto } from "../../types/k8s"
import { Button } from "../common/Button"
import { SearchInput } from "../common/SearchInput"
import { ClusterStats } from "./cluster/ClusterStats"
import { PodTable } from "./cluster/PodTable"
import type { PodTableItem } from "../../types/component/cluster/podTableProps"

export const ClusterOverviewTab = () => {
    const [data, setData] = useState<ClusterOverviewDto | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"all" | "app" | "platform">("all")

    const loadClusterData = () => {
        setLoading(true)
        new K8sApi()
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

    useEffect(() => {
        loadClusterData()
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <Server className="w-6 h-6 text-cud-skyblue" />
                        Klaszter és Pod Áttekintés
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Kubernetes workloadok, pod állapotok és konténer újraindítások valós időben.
                        {data?.timestamp && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {new Date(data.timestamp).toLocaleTimeString()})
                            </span>
                        )}
                    </p>
                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    loading={loading}
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={loadClusterData}
                >
                    Adatok frissítése
                </Button>
            </div>

            <ClusterStats
                totalPods={allPods.length}
                runningPods={runningCount}
                totalRestarts={totalRestarts}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Pod keresése név alapján..."
                    className="w-full sm:w-80"
                />

                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        className={`w-full sm:w-36 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200 cursor-pointer ${activeTab === "all"
                                ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                                : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        onClick={() => setActiveTab("all")}
                    >
                        Összes ({allPods.length})
                    </button>
                    <button
                        type="button"
                        className={`w-full sm:w-36 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200 cursor-pointer ${activeTab === "app"
                                ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                                : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        onClick={() => setActiveTab("app")}
                    >
                        App Podok ({data?.appPods?.length || 0})
                    </button>
                    <button
                        type="button"
                        className={`w-full sm:w-36 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200 cursor-pointer ${activeTab === "platform"
                                ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                                : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        onClick={() => setActiveTab("platform")}
                    >
                        Platform ({data?.platformPods?.length || 0})
                    </button>
                </div>
            </div>

            <PodTable pods={filteredPods} loading={loading} searchQuery={search} />
        </div>
    )
}
