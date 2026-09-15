import type { RateLimitCardProps } from "../../../types/component/traffic/rateLimitCardProps"
import type { PresetItem } from "../../../types/component/common/presetGroupProps"
import { Card } from "../../common/Card"
import { Button } from "../../common/Button"
import { Badge } from "../../common/Badge"
import { Slider } from "../../common/Slider"
import { PresetGroup } from "../../common/PresetGroup"
import { InfoCallout } from "../../common/InfoCallout"
import { Gauge, RotateCcw, Save, Sliders } from "lucide-react"

const RPS_PRESETS: PresetItem<number>[] = [
    { id: 50, label: "50 RPS", description: "Kímélő (Eco)", value: 50 },
    { id: 100, label: "100 RPS", description: "Normál üzemi", value: 100 },
    { id: 250, label: "250 RPS", description: "Nagy forgalom", value: 250 },
    { id: 500, label: "500 RPS", description: "Csúcs / Max", value: 500 },
]

const BURST_OPTIONS: PresetItem<number>[] = [
    { id: 1, label: "1x", badge: "Szigorú", description: "Nincs extra puffer", value: 1 },
    { id: 2, label: "2x", badge: "Kíméletes", description: "Kisebb mikrotüskék", value: 2 },
    { id: 3, label: "3x", badge: "Kiegyensúlyozott", description: "Átlagos terhelés", value: 3 },
    { id: 5, label: "5x", badge: "Ajánlott", description: "NGINX alapértelmezett", value: 5 },
    { id: 10, label: "10x", badge: "Megengedő", description: "Nagy tűréshatár", value: 10 },
]

const SLIDER_MARKS = [
    { value: 20, label: "20 (Min)" },
    { value: 100, label: "100" },
    { value: 250, label: "250" },
    { value: 500, label: "500 (Max)" },
]

export const RateLimitCard = ({ currentRps, selectRps, onRpsChange, currentBurst, selectBurst, onBurstChange, onSave, isLoading, }: RateLimitCardProps) => {
    const hasChanges = selectRps !== currentRps || selectBurst !== currentBurst
    const calculatedBufferCapacity = selectRps * selectBurst

    return (
        <Card
            title="Ingress Kérés-korlátozás Finomhangolása"
            subtitle="Dinamikus forgalomszabályozás NGINX Ingress szinten, konténer-újraindítás nélkül."
            hoverEffect={false}
            className="flex flex-col gap-6"
        >
            <PresetGroup
                title="Gyors Beállítási Profilok"
                subtitle="Ajánlott forgalmi forgatókönyvek"
                options={RPS_PRESETS}
                selectedId={selectRps}
                onSelect={(preset) => onRpsChange(preset.value)}
                disabled={isLoading}
                accentColor="skyblue"
                columns={4}
            />

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

                <Slider
                    value={selectRps}
                    min={20}
                    max={500}
                    step={10}
                    marks={SLIDER_MARKS}
                    accentColor="skyblue"
                    onChange={onRpsChange}
                    disabled={isLoading}
                    ariaLabel="Forgalomkorlát beállítása"
                />
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

                <PresetGroup
                    options={BURST_OPTIONS}
                    selectedId={selectBurst}
                    onSelect={(preset) => onBurstChange(preset.value)}
                    disabled={isLoading}
                    accentColor="purple"
                    columns={5}
                />

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

            <InfoCallout title="Hogyan működik a felhőalapú forgalomszabályozás?">
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
            </InfoCallout>

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