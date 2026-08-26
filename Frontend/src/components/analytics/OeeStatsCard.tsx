import { Activity, Clock, Zap, CheckCircle2, Package, AlertTriangle, Timer, AlertOctagon } from "lucide-react"
import type { OeeResponse } from "../../types/telemetry/Telemetry"

interface Definition {
    text: string
    color: string
}

export const OeeStatsCard = ({ oee }: { oee: OeeResponse | null }) => {
    const oeeValue = oee?.oeePercentage ?? 0
    const availability = oee?.availabilityPercentage ?? 0
    const performance = oee?.performancePercentage ?? 0
    const quality = oee?.qualityPercentage ?? 0

    const getDefinition = (value: number): Definition => {
        if (value >= 85) {
            return {
                text: "Kiváló (World-Class)",
                color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            }
        }
        if (value >= 65) {
            return {
                text: "Elfogadható",
                color: "text-amber-400 border-amber-500/30 bg-amber-500/10"
            }
        }
        return {
            text: "Beavatkozást igényel",
            color: "text-rose-400 border-rose-500/30 bg-rose-500/10"
        }
    }

    const currentDef = getDefinition(oeeValue)

    return (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-xl space-y-5 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">OEE - Teljes Eszközhatékonyság</h2>
                        <p className="text-xs text-slate-400">
                            A gép hatékonyságának mérése az elérhetőség, teljesítmény és minőség szorzataként.
                        </p>
                    </div>
                </div>

                <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${currentDef.color}`}>
                    <div className="text-right">
                        <div className="text-xl font-extrabold tracking-tight">{oeeValue.toFixed(1)}%</div>
                        <div className="text-xs font-semibold">{currentDef.text}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="flex flex-col p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Rendelkezésre állás</span>
                        </div>
                        <span className="text-base font-bold text-white font-mono">{availability.toFixed(1)}%</span>
                    </div>

                    <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                        <div
                            style={{ width: `${Math.min(100, Math.max(0, availability))}%` }}
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        />
                    </div>

                    <p className="text-xs text-slate-400">
                        Üzemidő: <span className="text-slate-200 font-medium">{oee?.uptimeMinutes ?? 0} perc</span> | Állás: <span className="text-slate-200 font-medium">{oee?.downtimeMinutes ?? 0} perc</span>
                    </p>
                </div>

                <div className="flex flex-col p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Teljesítmény</span>
                        </div>
                        <span className="text-base font-bold text-white font-mono">{performance.toFixed(1)}%</span>
                    </div>

                    <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                        <div
                            style={{ width: `${Math.min(100, Math.max(0, performance))}%` }}
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        />
                    </div>

                    <p className="text-xs text-slate-400">
                        Tényleges sebesség vs. Ideális ciklusidő
                    </p>
                </div>

                <div className="flex flex-col p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Minőség</span>
                        </div>
                        <span className="text-base font-bold text-white font-mono">{quality.toFixed(1)}%</span>
                    </div>

                    <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                        <div
                            style={{ width: `${Math.min(100, Math.max(0, quality))}%` }}
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        />
                    </div>

                    <p className="text-xs text-slate-400">
                        Jó: <span className="text-emerald-400 font-medium">{(oee?.totalProducedCount ?? 0) - (oee?.totalScrapCount ?? 0)} db</span> | Selejt: <span className="text-rose-400 font-medium">{oee?.totalScrapCount ?? 0} db</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                    <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Összes Termelés</div>
                        <div className="text-sm font-bold text-white font-mono">{oee?.totalProducedCount ?? 0} db</div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Selejt Szám</div>
                        <div className="text-sm font-bold text-white font-mono">{oee?.totalScrapCount ?? 0} db</div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                    <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Üzemidő</div>
                        <div className="text-sm font-bold text-white font-mono">{oee?.uptimeMinutes ?? 0} perc</div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Állásidő</div>
                        <div className="text-sm font-bold text-white font-mono">{oee?.downtimeMinutes ?? 0} perc</div>
                    </div>
                </div>
            </div>
        </div>
    )
}