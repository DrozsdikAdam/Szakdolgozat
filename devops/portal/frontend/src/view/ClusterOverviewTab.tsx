import { useClusterOverview } from "../hooks/useClusterOverview"
import type { ClusterOverviewTabProps, ClusterViewMode } from "../types/cluster"
import type { PodSourceFilter } from "../types/cluster"
import { LOG_TAIL_OPTIONS } from "../constants/cluster"
import { Button } from "../components/common/Button"
import { SearchInput } from "../components/common/SearchInput"
import { SegmentedControl } from "../components/common/SegmentedControl"
import { Select } from "../components/common/Select"
import { ClusterStats } from "../components/dashboard/cluster/ClusterStats"
import { PodTable } from "../components/dashboard/cluster/PodTable"
import { PodLogModal } from "../components/dashboard/cluster/PodLogModal"
import { ClusterEventsTable } from "../components/dashboard/cluster/ClusterEventsTable"
import { TerminalViewer } from "../components/dashboard/cluster/TerminalViewer"
import { RefreshCw, Server, Copy, Check } from "lucide-react"

export const ClusterOverviewTab = ({ initialView = "pods" }: ClusterOverviewTabProps) => {
    const {
        viewMode,
        handleViewModeChange,
        viewModeOptions,
        data,
        loading,
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
    } = useClusterOverview(initialView)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <Server className="w-6 h-6 text-cud-skyblue" />
                        Klaszter & Munkamenetek
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Kubernetes workloadok, pod állapotok, konténer naplók és életesemények valós időben egyetlen felületen.
                        {data?.timestamp && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {new Date(data.timestamp).toLocaleTimeString()})
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <SegmentedControl<ClusterViewMode>
                        value={viewMode}
                        onChange={handleViewModeChange}
                        options={viewModeOptions}
                        layout="pill"
                    />

                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isCurrentLoading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={handleRefresh}
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

                        <SegmentedControl<PodSourceFilter>
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
                        onViewLogs={(pod) => setSelectedModalPod(pod)}
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

            {viewMode === "logs" && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="w-full sm:w-72">
                                <Select<string>
                                    value={selectedLogPodName}
                                    onChange={setSelectedLogPodName}
                                    options={podSelectOptions}
                                    title="Konténer Pod kiválasztása"
                                />
                            </div>

                            <div className="w-32">
                                <Select<number>
                                    value={logTail}
                                    onChange={setLogTail}
                                    options={LOG_TAIL_OPTIONS}
                                    title="Sorok száma"
                                />
                            </div>

                            <div className="w-full sm:w-64 pt-5">
                                <SearchInput
                                    value={logSearch}
                                    onChange={setLogSearch}
                                    placeholder="Keresés a naplóban..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 md:pt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={autoScroll ? "text-cud-teal" : "text-slate-400"}
                            >
                                Auto-görgetés: {autoScroll ? "BE" : "KI"}
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                icon={copied ? <Check className="w-3.5 h-3.5 text-cud-teal" /> : <Copy className="w-3.5 h-3.5" />}
                                onClick={handleCopyLogs}
                            >
                                {copied ? "Másolva!" : "Másolás"}
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<RefreshCw className="w-3.5 h-3.5" />}
                                loading={logsLoading}
                                onClick={fetchLogsForSelected}
                            >
                                Újratöltés
                            </Button>
                        </div>
                    </div>

                    <TerminalViewer
                        lines={logLines}
                        loading={logsLoading}
                        searchQuery={logSearch}
                        autoScroll={autoScroll}
                        className="h-137.5"
                    />
                </div>
            )}

            {selectedModalPod && (
                <PodLogModal
                    pod={selectedModalPod}
                    onClose={() => setSelectedModalPod(null)}
                />
            )}
        </div>
    )
}
