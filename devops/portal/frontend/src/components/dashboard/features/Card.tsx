import { useState } from "react"
import { AlertTriangle, ArrowUpRight, HardDrive, Server, Zap, Settings, Check } from "lucide-react"
import { Badge } from "../../common/Badge"
import { Toggle } from "../../common/Toggle"
import type { FeatureCardProps } from "../../../types/component/features/featureCardProps"
import type { FeatureFlagName } from "../../../types/platform"
import { CARD_BORDER_STYLE, CATEGORY_CONFIG, NAVIGATION_TARGETS } from "../../../constants/featureFlags"
import { DEFAULT_STORAGE_ENDPOINTS, DEFAULT_STORAGE_BUCKETS } from "../../../constants/storage"

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
    if (key === "app_storage" || key === "backup_storage") {
        const mode = params.mode === "external" ? "Külső (S3)" : "Belső (MinIO)"
        const bucket = params.bucket ? `[${params.bucket}]` : ""
        return `${mode} ${bucket}`.trim()
    }
    return null
}

export const FeatureCard = ({
    feature,
    enabled,
    isToggling,
    strategy = "scale_to_zero",
    params = {},
    dbEngine = "postgres",
    onNavigate,
    onToggle
}: FeatureCardProps) => {

    const defaultBucket = feature.key === "app_storage" ? DEFAULT_STORAGE_BUCKETS.APP_STORAGE : DEFAULT_STORAGE_BUCKETS.BACKUP_STORAGE
    const [isEditingExternal, setIsEditingExternal] = useState<boolean>(false)
    const [externalEndpoint, setExternalEndpoint] = useState<string>(params.endpoint || DEFAULT_STORAGE_ENDPOINTS.EXTERNAL_S3)
    const [externalBucket, setExternalBucket] = useState<string>(
        params.bucket || defaultBucket
    )

    const isCriticalActive = Boolean(feature.isCritical && enabled)
    const criticalKey = String(isCriticalActive) as "true" | "false"

    const categoryInfo = CATEGORY_CONFIG[feature.category]
    const navInfo = NAVIGATION_TARGETS[feature.key]
    const paramSummary = getParamSummary(feature.key, params)

    const isStorageFeature = feature.key === "app_storage" || feature.key === "backup_storage"
    const storageMode = (params.mode as "internal" | "external") || "internal"

    const isDbCoordinated = feature.key === "pgbouncer" || feature.key === "haproxy"
    let dbCoordinationNote: string | null = null
    let isDbCoordinatedActive = false

    if (feature.key === "pgbouncer") {
        if (dbEngine === "postgres") {
            dbCoordinationNote = "Autonóm: PostgreSQL aktív → Connection pooler BE"
            isDbCoordinatedActive = true
        } else {
            dbCoordinationNote = `Inaktív: ${dbEngine.toUpperCase()} aktív (pooler nem kompatibilis)`
        }
    } else if (feature.key === "haproxy") {
        if (dbEngine === "mssql" || dbEngine === "oracle") {
            dbCoordinationNote = `Autonóm: ${dbEngine.toUpperCase()} aktív → TCP proxy & routing BE`
            isDbCoordinatedActive = true
        } else {
            dbCoordinationNote = "Inaktív: PostgreSQL natív cluster kapcsolatot használ"
        }
    }

    let statusInfo: { text: string; variant: "teal" | "skyblue" | "orange" | "neutral"; pulse: boolean };
    if (enabled) {
        statusInfo = { text: "Aktív (Fut)", variant: "teal", pulse: true };
    } else if (["pgbouncer", "haproxy", "cronjob_backup", "app_storage", "backup_storage"].includes(feature.key)) {
        if (strategy === "hot_standby") {
            statusInfo = { text: "Készenlét (1 Pod)", variant: "skyblue", pulse: false };
        } else {
            statusInfo = { text: "Leállítva (0 Pod)", variant: "orange", pulse: false };
        }
    } else {
        statusInfo = { text: "Inaktív", variant: "neutral", pulse: false };
    }

    const handleStorageModeSwitch = (newMode: "internal" | "external") => {
        const defaultEndpoint = newMode === "internal"
            ? DEFAULT_STORAGE_ENDPOINTS.INTERNAL
            : (externalEndpoint || DEFAULT_STORAGE_ENDPOINTS.EXTERNAL_S3)

        const updatedParams = {
            ...params,
            mode: newMode,
            endpoint: defaultEndpoint,
            bucket: params.bucket || defaultBucket
        }

        onToggle(feature.key, enabled, updatedParams)
    }

    const handleSaveExternalConfig = () => {
        const updatedParams = {
            ...params,
            mode: "external",
            endpoint: externalEndpoint,
            bucket: externalBucket
        }
        onToggle(feature.key, enabled, updatedParams)
        setIsEditingExternal(false)
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
                        onChange={(nextState) => onToggle(feature.key, nextState, params)}
                        ariaLabel={feature.label}
                    />
                </div>

                <p className="text-sm text-slate-400 mt-3.5 leading-relaxed">
                    {feature.description}
                </p>

                {isStorageFeature && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                {feature.key === "app_storage" ? (
                                    <HardDrive className="w-3.5 h-3.5 text-cud-teal" />
                                ) : (
                                    <Server className="w-3.5 h-3.5 text-cud-orange" />
                                )}
                                Tárhely Típusa:
                            </span>
                            <div className="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                                <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={() => handleStorageModeSwitch("internal")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${storageMode === "internal"
                                        ? "bg-cud-teal text-slate-950 shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                        }`}
                                >
                                    Belső (MinIO)
                                </button>
                                <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={() => handleStorageModeSwitch("external")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${storageMode === "external"
                                        ? "bg-cud-skyblue text-slate-950 shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                        }`}
                                >
                                    Külső (S3)
                                </button>
                            </div>
                        </div>

                        {storageMode === "internal" ? (
                            <div className="text-[11px] text-slate-400 flex items-center justify-between bg-slate-950/60 px-2.5 py-1.5 rounded-md border border-slate-800/80">
                                <span className="font-mono text-slate-300 truncate max-w-50 sm:max-w-65">
                                    {DEFAULT_STORAGE_ENDPOINTS.INTERNAL}
                                </span>
                                <span className="font-mono text-cud-teal text-[10px] uppercase font-bold shrink-0">
                                    Vödör: {params.bucket || defaultBucket}
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
                                <div className="flex items-center justify-between text-xs text-slate-300">
                                    <span className="text-[11px] font-mono text-slate-400 truncate max-w-55">
                                        {params.endpoint || DEFAULT_STORAGE_ENDPOINTS.EXTERNAL_S3}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingExternal(!isEditingExternal)}
                                        className="inline-flex items-center gap-1 text-[11px] text-cud-skyblue hover:underline cursor-pointer"
                                    >
                                        <Settings className="w-3 h-3" />
                                        {isEditingExternal ? "Mégse" : "Szerkesztés"}
                                    </button>
                                </div>

                                {isEditingExternal && (
                                    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-700/80 mt-1">
                                        <div>
                                            <label className="text-[10px] text-slate-400 block mb-0.5">S3 Végpont URL</label>
                                            <input
                                                type="text"
                                                value={externalEndpoint}
                                                onChange={(e) => setExternalEndpoint(e.target.value)}
                                                placeholder={DEFAULT_STORAGE_ENDPOINTS.EXTERNAL_S3}
                                                className="w-full text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cud-skyblue"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 block mb-0.5">Vödör (Bucket) Név</label>
                                            <input
                                                type="text"
                                                value={externalBucket}
                                                onChange={(e) => setExternalBucket(e.target.value)}
                                                placeholder={defaultBucket}
                                                className="w-full text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cud-skyblue"
                                            />
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={handleSaveExternalConfig}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-cud-skyblue text-slate-950 text-xs font-semibold cursor-pointer hover:bg-cud-skyblue/90"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Alkalmaz
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {isDbCoordinated && dbCoordinationNote && (
                    <div className={`mt-3 px-2.5 py-1.5 rounded-lg border flex items-center gap-2 text-xs ${isDbCoordinatedActive
                        ? "bg-slate-800/80 border-cud-teal/40 text-slate-200"
                        : "bg-slate-900/60 border-slate-800 text-slate-400"
                        }`}>
                        <Zap className={`w-3.5 h-3.5 shrink-0 ${isDbCoordinatedActive ? "text-cud-yellow" : "text-slate-500"}`} />
                        <span className="truncate">{dbCoordinationNote}</span>
                    </div>
                )}
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

                    {navInfo && onNavigate && (
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
