import { RefreshCw } from "lucide-react"
import type { AnalyticsFilterBarProps } from "../../types/telemetry/TelemetryProps"

export const AnalyticsFilterBar = ({ machines, selectedMachineId, onSelectMachine, isLive, onToggleLive, timeRange, onChangeTimeRange, onRefresh, isLoading }: AnalyticsFilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Kiválasztott Gép:
                </label>
                <select
                    value={selectedMachineId}
                    onChange={(e) => onSelectMachine(e.target.value)}
                    className="w-full sm:w-72 px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                >
                    {machines.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.code} - {m.name} ({m.status})
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 justify-end">
                <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <button
                        onClick={() => onChangeTimeRange("1h")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${timeRange === "1h"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-400 hover:text-white"
                            }`}
                    >
                        1 óra
                    </button>
                    <button
                        onClick={() => onChangeTimeRange("24h")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${timeRange === "24h"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-400 hover:text-white"
                            }`}
                    >
                        24 óra
                    </button>
                    <button
                        onClick={() => onChangeTimeRange("7d")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${timeRange === "7d"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-400 hover:text-white"
                            }`}
                    >
                        7 nap
                    </button>
                </div>

                <button
                    onClick={onToggleLive}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${isLive
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
                        : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                    title={isLive ? "Élő 5 másodpercenkénti frissítés bekapcsolva" : "Élő frissítés kikapcsolva"}
                >
                    <span className="relative flex h-2 w-2">
                        {isLive && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-emerald-500" : "bg-slate-500"}`}></span>
                    </span>
                    {isLive ? "Élő adatok (5s)" : "Élő mód: Ki"}
                </button>

                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
                    title="Frissítés most"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
                </button>
            </div>
        </div>
    )
}
