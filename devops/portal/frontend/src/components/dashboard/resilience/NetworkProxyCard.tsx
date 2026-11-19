import { useState } from "react"
import { Network, Play } from "lucide-react"
import type { NetworkFaultMode } from "../../../types/resilience"
import type { NetworkProxyCardProps } from "../../../types/component/resilience"
import { Card } from "../../common/Card"
import { Button } from "../../common/Button"
import { NETWORK_FAULT_MODES } from "../../../constants/resilience"

const getResultStatusClass = (success: boolean) => {
    if (!success) {
        return "bg-rose-500/10 text-rose-400 border-rose-500/30"
    }
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
}

const renderResultData = (data: unknown) => {
    if (!data) {
        return null
    }

    const formatted = typeof data === "string" ? data : JSON.stringify(data, null, 2)

    return (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 overflow-x-auto max-h-36">
            <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                {formatted}
            </pre>
        </div>
    )
}

export const NetworkProxyCard = ({ isTestingProxy, lastProxyResult, onTestProxy }: NetworkProxyCardProps) => {
    const [selectedMode, setSelectedMode] = useState<NetworkFaultMode>("normal")

    const handleRunTest = async () => {
        if (isTestingProxy) return
        await onTestProxy({ mode: selectedMode })
    }

    const getTestButtonLabel = () => {
        if (isTestingProxy) {
            return "Proxy lekérdezés folyamatban..."
        }
        return "Hibainjektálás Tesztelése"
    }

    const renderProxyResult = () => {
        if (!lastProxyResult) {
            return null
        }

        const statusClass = getResultStatusClass(lastProxyResult.success)

        return (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teszt Eredmény:</span>
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${statusClass}`}>
                            HTTP {lastProxyResult.statusCode}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Válaszidő:</span>
                        <span className="font-mono text-sm font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                            {lastProxyResult.responseTimeMs} ms
                        </span>
                    </div>
                </div>

                {renderResultData(lastProxyResult.data)}
            </div>
        )
    }

    return (
        <Card hoverEffect={false} className="flex flex-col gap-5 border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Network className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">NGINX Hálózati Hibainjektálás & Proxy</h3>
                        <p className="text-xs text-slate-400">Késleltetés, 500-as és 503-as hibák injektálása a mikro-szolgáltatások közé</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {NETWORK_FAULT_MODES.map((item) => {
                    const isSelected = selectedMode === item.mode
                    return (
                        <button
                            key={item.mode}
                            type="button"
                            onClick={() => setSelectedMode(item.mode)}
                            disabled={isTestingProxy}
                            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${isSelected
                                    ? "border-purple-500/60 bg-purple-500/15 shadow-md shadow-black/40 text-slate-100"
                                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-300"
                                }`}
                        >
                            <div className="flex items-center justify-between w-full mb-2">
                                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                    {item.icon}
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${item.colorClass}`}>
                                    {item.badgeText}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-slate-800/60">
                <span className="text-xs text-slate-400">
                    Kiválasztott mód: <span className="font-semibold text-purple-300 uppercase">{selectedMode}</span>
                </span>

                <Button
                    variant="primary"
                    loading={isTestingProxy}
                    disabled={isTestingProxy}
                    icon={<Play className="w-4 h-4" />}
                    onClick={handleRunTest}
                    className="w-full sm:w-auto font-medium"
                >
                    {getTestButtonLabel()}
                </Button>
            </div>

            {renderProxyResult()}
        </Card>
    )
}
