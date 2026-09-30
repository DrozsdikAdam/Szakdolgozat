import { AlertTriangle, ArrowUpRight } from "lucide-react"
import { Badge } from "../../common/Badge"
import { Toggle } from "../../common/Toggle"
import type { FeatureCardProps } from "../../../types/component/features/featureCardProps"
import type { FeatureFlagName } from "../../../types/platform"
import { CARD_BORDER_STYLE, CATEGORY_CONFIG, NAVIGATION_TARGETS } from "../../../constants/featureFlags"

const getParamSummary = (key: FeatureFlagName, params?: Record<string, any>): string | null => {
    if (!params) return null
    if (key === "rate_limiting") {
        const rps = params.rps ?? 100
        const burst = params.burst ?? 5
        return `${rps} RPS / ${burst}x puffer`
    }
    if (key === "hpa_scaling") {
        const min = params.minReplicas ?? 2
        const max = params.maxReplicas ?? 6
        const cpu = params.targetCpuUtil ?? 70
        return `${min}–${max} Pod / ${cpu}% CPU`
    }
    if (key === "vpa_scaling") {
        const mode = params.updateMode ?? "Auto"
        return `VPA ${mode}`
    }
    if (key === "cronjob_backup") {
        return params.schedule ? `Cron: ${params.schedule}` : "Napi 02:00"
    }
    return null
}

export const FeatureCard = ({ feature, enabled, isToggling, strategy = "scale_to_zero", params, onNavigate, onToggle }: FeatureCardProps) => {

    const isCriticalActive = Boolean(feature.isCritical && enabled)
    const criticalKey = String(isCriticalActive) as "true" | "false"

    const categoryInfo = CATEGORY_CONFIG[feature.category]
    const navInfo = NAVIGATION_TARGETS[feature.key]
    const paramSummary = getParamSummary(feature.key, params)

    let statusInfo: { text: string; variant: "teal" | "skyblue" | "orange" | "neutral"; pulse: boolean };
    if (enabled) {
        statusInfo = { text: "Aktív (Fut)", variant: "teal", pulse: true };
    } else if (["pgbouncer", "haproxy", "cronjob_backup"].includes(feature.key)) {
        if (strategy === "hot_standby") {
            statusInfo = { text: "Készenlét (1 Pod)", variant: "skyblue", pulse: false };
        } else {
            statusInfo = { text: "Leállítva (0 Pod)", variant: "orange", pulse: false };
        }
    } else {
        statusInfo = { text: "Inaktív", variant: "neutral", pulse: false };
    }

    return (
        <div
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${CARD_BORDER_STYLE[criticalKey]}`}
        >
            <div>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-center shrink-0">
                            {feature.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold text-slate-100">
                                    {feature.label}
                                </h3>
                                <Badge
                                    variant={categoryInfo.variant}
                                    text={categoryInfo.label}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>

                    <Toggle
                        checked={enabled}
                        loading={isToggling}
                        onChange={(nextState) => onToggle(feature.key, nextState)}
                        ariaLabel={feature.label}
                    />
                </div>

                <p className="text-sm text-slate-400 mt-3.5 leading-relaxed">
                    {feature.description}
                </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-800/70 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={statusInfo.variant}
                            text={statusInfo.text}
                            pulse={statusInfo.pulse}
                            size="sm"
                        />

                        {paramSummary && enabled && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
                                {paramSummary}
                            </span>
                        )}
                    </div>

                    {enabled && navInfo && onNavigate && (
                        <button
                            type="button"
                            onClick={() => onNavigate(navInfo.target)}
                            className="text-xs font-medium text-cud-skyblue hover:text-white flex items-center gap-1 transition-colors cursor-pointer group"
                        >
                            <span>{navInfo.label}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    )}
                </div>

                {isCriticalActive && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-cud-vermillon">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Kritikus üzemmód (forgalom korlátozva)</span>
                    </div>
                )}
            </div>
        </div>
    )
}
