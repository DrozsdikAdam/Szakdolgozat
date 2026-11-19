import { useEffect, useMemo, useState } from "react"
import {
    Activity,
    ArrowDown,
    Check,
    Copy,
    RefreshCw,
    Terminal
} from "lucide-react"
import { K8sApi } from "../../../client/api/k8s"
import type { PodLogModalProps } from "../../../types/component/cluster/podLogModalProps"
import type { K8sEventDto } from "../../../types/k8s"
import type { SelectOption } from "../../../types/component/common/selectProps"
import type { SegmentedControlOption } from "../../../types/component/common/segmentedControlProps"
import { Badge } from "../../common/Badge"
import { useNamespaces } from "../../../hooks/useNamespaces"
import { Button } from "../../common/Button"
import { EmptyState } from "../../common/EmptyState"
import { SearchInput } from "../../common/SearchInput"
import { Select } from "../../common/Select"
import { Modal } from "../../common/Modal"
import { SegmentedControl } from "../../common/SegmentedControl"
import { TerminalViewer } from "./TerminalViewer"

const tailOptions: SelectOption<number>[] = [
    { value: 50, label: "50 sor" },
    { value: 150, label: "150 sor" },
    { value: 300, label: "300 sor" },
    { value: 500, label: "500 sor" }
]

export const PodLogModal = ({ pod, onClose }: PodLogModalProps) => {
    const [activeTab, setActiveTab] = useState<"logs" | "events">("logs")
    const [lines, setLines] = useState<string[]>([])
    const [events, setEvents] = useState<K8sEventDto[]>([])
    const [containerName, setContainerName] = useState<string>("")
    const [loadingLogs, setLoadingLogs] = useState<boolean>(true)
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [tail, setTail] = useState<number>(150)
    const [autoScroll, setAutoScroll] = useState<boolean>(true)
    const [copied, setCopied] = useState<boolean>(false)

    const k8sApi = useMemo(() => new K8sApi(), [])
    const { defaultAppNamespace, defaultPlatformNamespace } = useNamespaces(false)
    const namespace = pod.namespace || (pod.source === "app" ? defaultAppNamespace : defaultPlatformNamespace)

    const fetchLogs = async () => {
        setLoadingLogs(true)
        try {
            const data = await k8sApi.getPodLogs(namespace, pod.name, tail)
            setLines(data.lines || [])
            setContainerName(data.containerName || pod.name)
        } catch {
            setLines(["[ERROR] Nem sikerült kapcsolatot létesíteni a pod naplófájljával."])
        } finally {
            setLoadingLogs(false)
        }
    }

    const fetchEvents = async () => {
        setLoadingEvents(true)
        try {
            const data = await k8sApi.getEvents(namespace, pod.name)
            setEvents(data || [])
        } catch {
            setEvents([])
        } finally {
            setLoadingEvents(false)
        }
    }

    useEffect(() => {
        fetchLogs()
        fetchEvents()
    }, [pod.name, namespace, tail])

    const filteredLines = useMemo(() => {
        if (!searchQuery.trim()) return lines
        const q = searchQuery.toLowerCase()
        return lines.filter((line) => line.toLowerCase().includes(q))
    }, [lines, searchQuery])

    const handleCopy = () => {
        const textToCopy = filteredLines.join("\n")
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const tabOptions: SegmentedControlOption<"logs" | "events">[] = [
        {
            id: "logs",
            label: "Konténer Napló",
            count: lines.length,
            icon: <Terminal className="w-3.5 h-3.5" />,
            variant: "skyblue"
        },
        {
            id: "events",
            label: "Pod Események",
            count: events.length,
            icon: <Activity className="w-3.5 h-3.5" />,
            variant: "skyblue"
        }
    ]

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            icon={<Terminal className="w-5 h-5" />}
            title={pod.name}
            headerExtra={
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {namespace}
                    </span>
                    {containerName && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cud-skyblue-bg text-cud-skyblue border border-cud-skyblue-border">
                            konténer: {containerName}
                        </span>
                    )}
                </div>
            }
            subtitle={`Készültség: ${pod.ready} | Újraindítások: ${pod.restarts}x | Életkor: ${pod.age}`}
            footer={
                <div className="px-5 py-2.5 text-xs text-slate-400 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cud-teal animate-pulse" />
                        <span>K8s Live Log Stream</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Sorok: {filteredLines.length} / {lines.length}</span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                            className="h-6 text-xs px-2.5"
                        >
                            Bezárás
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <SegmentedControl<"logs" | "events">
                    value={activeTab}
                    onChange={setActiveTab}
                    options={tabOptions}
                    layout="pill"
                />

                {activeTab === "logs" && (
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Keresés naplóban..."
                            className="w-full sm:w-56"
                        />

                        <Select<number>
                            value={tail}
                            onChange={setTail}
                            options={tailOptions}
                            title="Sorok száma"
                        />

                        <button
                            type="button"
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`p-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${autoScroll
                                    ? "bg-slate-800 text-cud-skyblue border-cud-skyblue/40"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                }`}
                            title={autoScroll ? "Auto-scroll aktív" : "Auto-scroll kikapcsolva"}
                        >
                            <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <Button
                            variant="secondary"
                            size="sm"
                            icon={copied ? <Check className="w-3.5 h-3.5 text-cud-teal" /> : <Copy className="w-3.5 h-3.5" />}
                            onClick={handleCopy}
                            className="text-xs h-7 px-2.5"
                        >
                            {copied ? "Másolva!" : "Másolás"}
                        </Button>

                        <button
                            type="button"
                            onClick={fetchLogs}
                            disabled={loadingLogs}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Napló frissítése"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin text-cud-skyblue" : ""}`} />
                        </button>
                    </div>
                )}

                {activeTab === "events" && (
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingEvents ? "animate-spin text-cud-skyblue" : ""}`} />}
                        onClick={fetchEvents}
                        disabled={loadingEvents}
                        className="text-xs h-7 px-2.5"
                    >
                        Események frissítése
                    </Button>
                )}
            </div>

            {activeTab === "logs" && (
                <TerminalViewer
                    lines={lines}
                    loading={loadingLogs}
                    searchQuery={searchQuery}
                    autoScroll={autoScroll}
                />
            )}

            {activeTab === "events" && (
                <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-2 select-text">
                    {loadingEvents && events.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                            <RefreshCw className="w-8 h-8 animate-spin text-cud-skyblue mb-3" />
                            <p className="text-xs font-mono">Pod események lekérése...</p>
                        </div>
                    )}

                    {!loadingEvents && events.length === 0 && (
                        <div className="py-12">
                            <EmptyState
                                icon={<Activity className="w-8 h-8" />}
                                title="Nincsenek események"
                                description="Ehhez a podhoz jelenleg nem rögzített új életciklus eseményt a Kubernetes."
                            />
                        </div>
                    )}

                    {events.map((evt) => (
                        <div
                            key={evt.id}
                            className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col gap-1.5"
                        >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={evt.type === "Warning" ? "vermillon" : "teal"}
                                        text={evt.reason}
                                        size="sm"
                                    />
                                    <span className="text-xs font-semibold text-slate-200">
                                        {evt.involvedObjectName} ({evt.involvedObjectKind})
                                    </span>
                                    {evt.count > 1 && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                            {evt.count}x
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                    {new Date(evt.lastTimestamp).toLocaleString("hu-HU")}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-sans leading-relaxed">
                                {evt.message}
                            </p>
                            {evt.sourceComponent && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Forrás: {evt.sourceComponent}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}
