import type { RateLimitCardProps } from "../../../types/component/traffic/rateLimitCardProps"
import { Card } from "../../common/Card"
import { Button } from "../../common/Button"
import { Badge } from "../../common/Badge"
import { Gauge, Info, RotateCcw, Save, Sliders, Zap } from "lucide-react"

interface PresetOption {
    value: number
    label: string
    description: string
}

const PRESET_OPTIONS: PresetOption[] = [
    { value: 50, label: "50 RPS", description: "Kímélő (Eco)" },
    { value: 100, label: "100 RPS", description: "Normál üzemi" },
    { value: 250, label: "250 RPS", description: "Nagy forgalom" },
    { value: 500, label: "500 RPS", description: "Csúcs / Max" },
]

interface BurstOption {
    value: number
    label: string
    badge: string
    description: string
}

const BURST_OPTIONS: BurstOption[] = [
    { value: 1, label: "1x", badge: "Szigorú", description: "Nincs extra puffer" },
    { value: 2, label: "2x", badge: "Kíméletes", description: "Kisebb mikrotüskék" },
    { value: 3, label: "3x", badge: "Kiegyensúlyozott", description: "Átlagos terhelés" },
    { value: 5, label: "5x", badge: "Ajánlott", description: "NGINX alapértelmezett" },
    { value: 10, label: "10x", badge: "Megengedő", description: "Nagy tűréshatár" },
]

const SLIDER_MIN = 20
const SLIDER_MAX = 500

const SLIDER_MARKS = [
    { value: 20, label: "20 (Min)" },
    { value: 100, label: "100" },
    { value: 250, label: "250" },
    { value: 500, label: "500 (Max)" },
]

export const RateLimitCard = ({
    currentRps,
    selectRps,
    onRpsChange,
    currentBurst,
    selectBurst,
    onBurstChange,
    onSave,
    isLoading,
}: RateLimitCardProps) => {
    const hasChanges = selectRps !== currentRps || selectBurst !== currentBurst
    const calculatedBufferCapacity = selectRps * selectBurst

    return (
        <Card
            title="Ingress Kérés-korlátozás Finomhangolása"
            subtitle="Dinamikus forgalomszabályozás NGINX Ingress szinten, konténer-újraindítás nélkül."
            hoverEffect={false}
            className="flex flex-col gap-6"
        >
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cud-skyblue" />
                        Gyors Beállítási Profilok
                    </label>
                    <span className="text-xs text-slate-500">
                        Ajánlott forgalmi forgatókönyvek
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_OPTIONS.map((preset) => {
                        const isSelected = selectRps === preset.value
                        return (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => onRpsChange(preset.value)}
                                disabled={isLoading}
                                className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer disabled:opacity-50 ${isSelected
                                    ? "bg-cud-skyblue/10 border-cud-skyblue text-cud-skyblue shadow-lg shadow-cud-skyblue/10"
                                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                                    }`}
                            >
                                <div className="text-sm font-bold font-mono">
                                    {preset.label}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {preset.description}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-cud-teal" />
                            Kérésszám Küszöbérték (Requests Per Second)
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Egy kliens IP címről maximálisan engedélyezett kérések száma másodpercenként.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectRps !== currentRps ? (
                            <Badge
                                variant="orange"
                                size="sm"
                                text={`Módosítás: ${currentRps} ➔ ${selectRps} RPS`}
                            />
                        ) : (
                            <Badge
                                variant="teal"
                                size="sm"
                                text={`Szinkronban: ${currentRps} RPS`}
                            />
                        )}
                        <span className="text-3xl font-extrabold text-cud-skyblue font-mono">
                            {selectRps}{" "}
                            <span className="text-sm font-normal text-slate-400">
                                RPS
                            </span>
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1 pt-2">
                    <input
                        type="range"
                        min={SLIDER_MIN}
                        max={SLIDER_MAX}
                        step="10"
                        value={selectRps}
                        onChange={(e) => onRpsChange(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cud-skyblue focus:outline-none transition-all"
                        aria-label="Forgalomkorlát beállítása"
                    />

                    <div className="relative w-full h-5 text-xs text-slate-500 font-mono select-none mt-1">
                        {SLIDER_MARKS.map((mark) => {
                            const percent = ((mark.value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100
                            const isAtStart = mark.value === SLIDER_MIN
                            const isAtEnd = mark.value === SLIDER_MAX
                            const transform = isAtStart
                                ? "translateX(0%)"
                                : isAtEnd
                                    ? "translateX(-100%)"
                                    : "translateX(-50%)"

                            const isCurrentOrSelected = selectRps === mark.value

                            return (
                                <button
                                    key={mark.value}
                                    type="button"
                                    onClick={() => onRpsChange(mark.value)}
                                    disabled={isLoading}
                                    style={{ left: `${percent}%`, transform }}
                                    className={`absolute top-0 cursor-pointer transition-colors hover:text-slate-200 focus:outline-none ${isCurrentOrSelected ? "text-cud-skyblue font-bold" : "text-slate-500"
                                        }`}
                                >
                                    {mark.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-cud-purple" />
                            Kéréspuffer Multiplikátor (Burst Multiplier)
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Átmeneti kéréshullámok pufferelése. A puffer feletti kérések azonnal HTTP 429 választ kapnak.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectBurst !== currentBurst ? (
                            <Badge
                                variant="orange"
                                size="sm"
                                text={`Módosítás: ${currentBurst}x ➔ ${selectBurst}x`}
                            />
                        ) : (
                            <Badge
                                variant="purple"
                                size="sm"
                                text={`Szinkronban: ${currentBurst}x`}
                            />
                        )}
                        <span className="text-3xl font-extrabold text-cud-purple font-mono">
                            {selectBurst}x
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    {BURST_OPTIONS.map((burstOpt) => {
                        const isSelected = selectBurst === burstOpt.value
                        return (
                            <button
                                key={burstOpt.value}
                                type="button"
                                onClick={() => onBurstChange(burstOpt.value)}
                                disabled={isLoading}
                                className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer disabled:opacity-50 ${isSelected
                                    ? "bg-cud-purple/10 border-cud-purple text-cud-purple shadow-lg shadow-cud-purple/10"
                                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold font-mono">
                                        {burstOpt.label}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                        {burstOpt.badge}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                    {burstOpt.description}
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Kiszámított pufferkapacitás:</span>
                        <span className="font-mono font-bold text-cud-purple">
                            {calculatedBufferCapacity} kérés
                        </span>
                        <span className="text-slate-500 font-mono">
                            ({selectRps} RPS × {selectBurst}x)
                        </span>
                    </div>
                    <span className="text-slate-400 hidden sm:inline">
                        Túllépés esetén: <span className="text-cud-vermillon font-semibold">HTTP 429 Too Many Requests</span>
                    </span>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
                <Info className="w-5 h-5 text-cud-skyblue shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold text-slate-300 block mb-0.5">
                        Hogyan működik a felhőalapú forgalomszabályozás?
                    </span>
                    A beállított értékek közvetlenül az Ingress Controller annotációiba kerülnek beírásra:
                    <div className="flex flex-wrap gap-2 my-1.5 font-mono text-xs">
                        <span className="bg-slate-800 text-cud-teal px-2 py-0.5 rounded">
                            nginx.ingress.kubernetes.io/limit-rps: &quot;{selectRps}&quot;
                        </span>
                        <span className="bg-slate-800 text-cud-purple px-2 py-0.5 rounded">
                            nginx.ingress.kubernetes.io/limit-burst-multiplier: &quot;{selectBurst}&quot;
                        </span>
                    </div>
                    A módosítás azonnal, <strong>konténer-újraindítás nélkül (Zero-Downtime)</strong> lép életbe, és védelmet nyújt a hirtelen kéréscunami vagy DoS jellegű túlterhelés ellen.
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                    {hasChanges && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<RotateCcw className="w-4 h-4" />}
                            onClick={() => {
                                onRpsChange(currentRps)
                                onBurstChange(currentBurst)
                            }}
                            disabled={isLoading}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            Visszaállítás ({currentRps} RPS / {currentBurst}x)
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        loading={isLoading}
                        disabled={!hasChanges || isLoading}
                        icon={<Save className="w-4 h-4" />}
                        onClick={onSave}
                    >
                        Alkalmazás az Ingressre
                    </Button>
                </div>
            </div>
        </Card>
    )
}