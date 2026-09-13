import { AlertTriangle } from "lucide-react"
import { Badge } from "../../common/Badge"
import { Toggle } from "../../common/Toggle"
import type { FeatureCardProps, FeatureCategory } from "../../../types/component/features/featureCardProps"

const CARD_BORDER_STYLE: Record<"true" | "false", string> = {
    true: "border-cud-vermillon/60 bg-cud-vermillon/5 shadow-lg shadow-cud-vermillon/5",
    false: "border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80"
}

const CATEGORY_CONFIG: Record<FeatureCategory, { label: string; variant: "skyblue" | "teal" | "purple" | "orange" }> = {
    traffic: { label: "Forgalom", variant: "skyblue" },
    database: { label: "Adatbázis", variant: "teal" },
    scaling: { label: "Skálázás", variant: "purple" },
    operations: { label: "Üzemeltetés", variant: "orange" }
}

const STATUS_CONFIG: Record<"true" | "false", { text: string; variant: "teal" | "neutral"; pulse: boolean }> = {
    true: { text: "Aktív", variant: "teal", pulse: true },
    false: { text: "Inaktív", variant: "neutral", pulse: false }
}

export const FeatureCard = ({ feature, enabled, isToggling, onToggle }: FeatureCardProps) => {

    const isCriticalActive = Boolean(feature.isCritical && enabled)
    const criticalKey = String(isCriticalActive) as "true" | "false"
    const statusKey = String(enabled) as "true" | "false"

    const categoryInfo = CATEGORY_CONFIG[feature.category]
    const statusInfo = STATUS_CONFIG[statusKey]

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

            <div className="mt-4 pt-3.5 border-t border-slate-800/70 flex items-center justify-between gap-2 flex-wrap">
                <Badge
                    variant={statusInfo.variant}
                    text={statusInfo.text}
                    pulse={statusInfo.pulse}
                    size="sm"
                />

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
