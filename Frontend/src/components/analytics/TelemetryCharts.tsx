import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend
} from "recharts"
import type { TelemertyResponse } from "../../types/telemetry/Telemetry"

export const TelemetryCharts = ({ history }: { history: TelemertyResponse[] }) => {

    const chartData = [...history].reverse().map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        temperature: Number(item.temperature?.toFixed(1) || 0),
        vibration: Number(item.vibration?.toFixed(2) || 0),
        powerKw: Number(item.powerKw?.toFixed(1) || 0),
        pressureBar: Number(item.pressureBar?.toFixed(1) || 0),
        producedCount: item.producedCount || 0,
        scrapCount: item.scrapCount || 0
    }))

    if (chartData.length === 0) {
        return (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400 font-medium backdrop-blur-xl">
                Még nincsenek elérhető idősoros telemetriai adatok ehhez a géphez.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-xl space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">Hőmérséklet & Rezgés Trend</h4>
                        <p className="text-xs text-slate-400">Időbeli alakulás (°C és mm/s)</p>
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="vibGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    borderRadius: "0.75rem",
                                    fontSize: "12px",
                                    color: "#fff"
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                            <Area
                                type="monotone"
                                dataKey="temperature"
                                name="Hőmérséklet (°C)"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#tempGradient)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="vibration"
                                name="Rezgés (mm/s)"
                                stroke="#6366f1"
                                fillOpacity={1}
                                fill="url(#vibGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-xl space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">Teljesítmény & Nyomás</h4>
                        <p className="text-xs text-slate-400">Villamos áramfelvétel (kW) és Nyomás (bar)</p>
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    borderRadius: "0.75rem",
                                    fontSize: "12px",
                                    color: "#fff"
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                            <Area
                                type="monotone"
                                dataKey="powerKw"
                                name="Teljesítmény (kW)"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#powerGradient)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="pressureBar"
                                name="Nyomás (bar)"
                                stroke="#06b6d4"
                                fillOpacity={1}
                                fill="url(#pressureGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
