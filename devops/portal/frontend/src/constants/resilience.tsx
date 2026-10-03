import { Activity, AlertOctagon, CheckCircle2, Clock, ServerCrash, ShieldAlert, TrendingUp } from "lucide-react"
import type { ChaosExperimentStatus, LoadTestJobStatus, NetworkFaultModeOption, ScenarioOption } from "../types/resilience"
import type { BadgeProps } from "../types/component/badgeProps"

export const DEFAULT_RESILIENCE_NAMESPACE = "platform-infra"
export const DEFAULT_TARGET_HOST = "paas-portal-backend.platform-infra.svc.cluster.local"
export const DEFAULT_TARGET_PORT = 3000

export const QUICK_POD_PRESETS = [
    "paas-resilience-proxy",
    "paas-portal-backend",
    "paas-portal-frontend",
    "coredns"
] as const

export const RESILIENCE_SCENARIOS: ScenarioOption[] = [
    {
        id: "baseline",
        title: "Baseline (Alap)",
        subtitle: "10 RPS normál forgalom",
        description: "Folyamatos, stabil alapterhelés átlagos válaszidők és normál SLA ellenőrzésére.",
        icon: <Activity className="w-5 h-5 text-sky-400" />,
        accentBorder: "border-sky-500/40",
        accentBg: "bg-sky-500/10",
        accentText: "text-sky-300"
    },
    {
        id: "spike",
        title: "Spike (Tüske)",
        subtitle: "Hirtelen terhelésugrás",
        description: "Drasztikus forgalomrobbanás a HPA horizontális autoskálázás teszteléséhez.",
        icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
        accentBorder: "border-amber-500/40",
        accentBg: "bg-amber-500/10",
        accentText: "text-amber-300"
    },
    {
        id: "failover",
        title: "Failover (Hibatűrés)",
        subtitle: "Kiesés alatti terhelés",
        description: "Folyamatos terhelés pod újraindulások közben a magas rendelkezésre állás (HA) igazolására.",
        icon: <ShieldAlert className="w-5 h-5 text-purple-400" />,
        accentBorder: "border-purple-500/40",
        accentBg: "bg-purple-500/10",
        accentText: "text-purple-300"
    }
]

export const NETWORK_FAULT_MODES: NetworkFaultModeOption[] = [
    {
        mode: "normal",
        title: "Normál Proxy",
        description: "Transzparens proxy forgalom késleltetés és hibainjektálás nélkül.",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        badgeText: "200 OK",
        colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    },
    {
        mode: "latency",
        title: "Késleltetés (3 mp)",
        description: "Mesterséges 3000 ms késleltetés injektálása timeout kezelés teszteléséhez.",
        icon: <Clock className="w-4 h-4 text-amber-400" />,
        badgeText: "+3000ms",
        colorClass: "border-amber-500/30 bg-amber-500/10 text-amber-300"
    },
    {
        mode: "fault",
        title: "Szerver Hiba (500)",
        description: "Belső szerverhiba (HTTP 500) kényszerítése hibakezelés validálására.",
        icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
        badgeText: "500 Error",
        colorClass: "border-rose-500/30 bg-rose-500/10 text-rose-300"
    },
    {
        mode: "unavailable",
        title: "Kiesés (503)",
        description: "Szolgáltatás-kiesés (HTTP 503) szimulációja circuit breaker tesztekhez.",
        icon: <ServerCrash className="w-4 h-4 text-purple-400" />,
        badgeText: "503 Down",
        colorClass: "border-purple-500/30 bg-purple-500/10 text-purple-300"
    }
]

export interface StatusBadgeConfig {
    variant: BadgeProps["variant"]
    text: string
    pulse?: boolean
}

export const LOAD_TEST_STATUS_CONFIG: Record<LoadTestJobStatus, StatusBadgeConfig> = {
    RUNNING: { variant: "skyblue", text: "Fut", pulse: true },
    PENDING: { variant: "orange", text: "Várakozik", pulse: true },
    COMPLETED: { variant: "teal", text: "Befejezve" },
    FAILED: { variant: "vermillon", text: "Meghiúsult" },
    UNKNOWN: { variant: "neutral", text: "Ismeretlen" }
}

export const CHAOS_STATUS_CONFIG: Record<ChaosExperimentStatus, StatusBadgeConfig> = {
    RECOVERED: { variant: "teal", text: "Helyreállt" },
    RUNNING: { variant: "orange", text: "Mérés alatt", pulse: true },
    FAILED: { variant: "vermillon", text: "Meghiúsult" },
    PENDING: { variant: "neutral", text: "Várakozik" }
}

export const formatResilienceDate = (dateStr: string): string => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString("hu-HU", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    })
}
