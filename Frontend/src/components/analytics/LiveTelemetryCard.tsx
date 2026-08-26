import { Thermometer, Zap, Gauge, Radio, Waves, CheckCircle, AlertTriangle, AlertOctagon, Wrench } from "lucide-react"
import type { TelemertyResponse } from "../../types/telemetry/Telemetry"
import type { MachineStatus } from "../../types/machine/MachineStatus"

export const LiveTelemetryCard = ({ telemetry }: { telemetry: TelemertyResponse | null }) => {
    const getStatusBadge = (status?: MachineStatus) => {
        switch (status) {
            case "RUNNING":
                return {
                    label: "Működik (Termelés)",
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                    icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                }
            case "IDLE":
                return {
                    label: "Készenlét (Üresjárat)",
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
                    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                }
            case "MAINTENANCE":
                return {
                    label: "Karbantartás alatt",
                    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
                    icon: <Wrench className="w-3.5 h-3.5 text-blue-400" />
                }
            case "ERROR":
                return {
                    label: "Hibaállapot (Leállás)",
                    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
                    icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                }
            case "OFFLINE":
            default:
                return {
                    label: "Kikapcsolva (Offline)",
                    color: "text-slate-400 bg-slate-500/10 border-slate-500/30",
                    icon: <Radio className="w-3.5 h-3.5 text-slate-400" />
                }
        }
    }

    const statusInfo = getStatusBadge(telemetry?.status)
    const temp = telemetry?.temperature ?? 0
    const power = telemetry?.powerKw ?? 0
    const pressure = telemetry?.pressureBar ?? 0
    const vibration = telemetry?.vibration ?? 0

    return (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-xl space-y-4 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white tracking-tight">Pillanatnyi PLC Szenzoradatok</h3>
                        <p className="text-xs text-slate-400">Valós idejű telemetria a gép beépített érzékelőiből</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className={`p-4 rounded-xl border space-y-2 transition-all ${temp > 80
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-slate-800/50 border-slate-700/60 text-slate-200"
                    }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hőmérséklet</span>
                        <Thermometer className={`w-4 h-4 ${temp > 80 ? "text-rose-400" : "text-amber-400"}`} />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                        {temp.toFixed(1)} <span className="text-sm font-sans text-slate-400">°C</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                        {temp > 80 ? "⚠️ Magas hőmérséklet!" : "Optimális működési tartomány"}
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Teljesítmény</span>
                        <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                        {power.toFixed(1)} <span className="text-sm font-sans text-slate-400">kW</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Pillanatnyi áramfelvétel</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nyomás</span>
                        <Gauge className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                        {pressure.toFixed(1)} <span className="text-sm font-sans text-slate-400">bar</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Hidraulika / pneumatika</div>
                </div>


                <div className={`p-4 rounded-xl border space-y-2 transition-all ${vibration > 4.0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-slate-800/50 border-slate-700/60 text-slate-200"
                    }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rezgésszint</span>
                        <Waves className={`w-4 h-4 ${vibration > 4.0 ? "text-rose-400" : "text-indigo-400"}`} />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                        {vibration.toFixed(2)} <span className="text-sm font-sans text-slate-400">mm/s</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                        {vibration > 4.0 ? "⚠️ Megnövekedett vibráció!" : "Normál mechanikai állapot"}
                    </div>
                </div>
            </div>
        </div>
    )
}
