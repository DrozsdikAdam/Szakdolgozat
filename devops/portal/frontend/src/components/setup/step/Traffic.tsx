import { Gauge, Sliders, Zap, ShieldCheck } from "lucide-react"
import type { SetupStepComponentProps } from "../../../types/component/setup/setupDataProps"
import type { PresetItem } from "../../../types/component/common/presetGroupProps"
import type { SliderMark } from "../../../types/component/common/sliderProps"
import { Button } from "../../common/Button"
import { InfoCallout } from "../../common/InfoCallout"
import { PresetGroup } from "../../common/PresetGroup"
import { Slider } from "../../common/Slider"

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

const SLIDER_MARKS: SliderMark[] = [
    { value: 20, label: "20 (Min)" },
    { value: 100, label: "100" },
    { value: 250, label: "250" },
    { value: 500, label: "500 (Max)" },
]

export const TrafficStep = ({ data, onChange, disabled }: SetupStepComponentProps) => {
    const calculatedBufferCapacity = data.rateLimitRps * data.burstMultiplier

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-cud-teal" />
                        Forgalomszabályozás & DDoS Védelem
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Dinamikus kéréskorlátozás és tüsketűrés beállítása NGINX Ingress szinten.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant={data.trafficEnabled ? "primary" : "secondary"}
                        size="md"
                        onClick={() => onChange("trafficEnabled", true)}
                        disabled={disabled}
                    >
                        Bekapcsolva
                    </Button>
                    <Button
                        variant={!data.trafficEnabled ? "danger" : "secondary"}
                        size="md"
                        onClick={() => onChange("trafficEnabled", false)}
                        disabled={disabled}
                    >
                        Kikapcsolva
                    </Button>
                </div>
            </div>

            {
                data.trafficEnabled && (
                    <div className="flex flex-col gap-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner">
                        <PresetGroup
                            title="Gyors Beállítási Profilok"
                            subtitle="Ajánlott forgalmi forgatókönyvek"
                            options={RPS_PRESETS}
                            selectedId={data.rateLimitRps}
                            onSelect={(preset) => onChange("rateLimitRps", preset.value)}
                            accentColor="skyblue"
                            columns={4}
                            disabled={disabled}
                        />

                        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-cud-teal" />
                                        Kérésszám Küszöbérték (Requests Per Second)
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        IP-címenként engedélyezett folyamatos másodpercenkénti kérésszám.
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                    <span className="text-xs text-slate-400">Aktuális érték:</span>
                                    <span className="text-sm font-bold font-mono text-cud-teal">
                                        {data.rateLimitRps} RPS
                                    </span>
                                </div>
                            </div>

                            <Slider
                                value={data.rateLimitRps}
                                min={20}
                                max={500}
                                step={5}
                                onChange={(val) => onChange("rateLimitRps", val)}
                                marks={SLIDER_MARKS}
                                accentColor="teal"
                                disabled={disabled}
                                ariaLabel="Requests Per Second csúszka"
                            />
                        </div>

                        <div className="pt-2 border-t border-slate-800/60">
                            <PresetGroup
                                title="Burst Multiplier (Tüsketűrési Szorzó)"
                                subtitle="Hányszoros forgalmi túllépést toleráljon átmenetileg az Ingress"
                                options={BURST_OPTIONS}
                                selectedId={data.burstMultiplier}
                                onSelect={(preset) => onChange("burstMultiplier", preset.value)}
                                columns={5}
                                accentColor="orange"
                                disabled={disabled}
                            />
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-3">
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-cud-teal/15 text-cud-teal border border-cud-teal/30 shrink-0">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-slate-300">
                                            Számított Effektív Pufferkapacitás
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            {data.rateLimitRps} RPS × {data.burstMultiplier}x szorzó = max. hirtelen kérelem
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <span className="text-xl font-black font-mono text-cud-teal">
                                        {calculatedBufferCapacity}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-1.5 font-medium">
                                        kérés pufferelve
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                                <ShieldCheck className="w-4 h-4 text-cud-teal shrink-0" />
                                <span>
                                    Ingress annotációk: <code className="text-slate-300 font-mono">nginx.ingress.kubernetes.io/limit-rps: "{data.rateLimitRps}"</code> és <code className="text-slate-300 font-mono">limit-burst-multiplier: "{data.burstMultiplier}"</code>. Konténer-újraindítás nélkül frissül.
                                </span>
                            </div>
                        </div>
                    </div>
                )}

            {!data.trafficEnabled && (
                <div className="w-full">
                    <InfoCallout
                        title="A forgalomkorlátozás inaktív"
                        icon={<Gauge className="w-5 h-5 text-cud-teal" />}
                    >
                        <p>
                            Az Ingress Controller minden beérkező kérést szűrés és sebességkorlát nélkül továbbít a háttérszolgáltatásokhoz. Nagyobb terhelés vagy támadás esetén az alkalmazás védtelen lehet, de a funkciót később bármikor bekapcsolhatod a Vezérlőpultban.
                        </p>
                    </InfoCallout>
                </div>
            )}
        </div>
    )
}