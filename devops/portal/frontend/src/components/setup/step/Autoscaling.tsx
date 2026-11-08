import { Cpu, Server, ShieldCheck, Zap, Sliders, TrendingUp } from "lucide-react"
import type { InstanceSize, SetupStepComponentProps } from "../../../types/component/setup/setupDataProps"
import type { InactivationStrategy } from "../../../types/platform"
import type { PresetItem } from "../../../types/component/common/presetGroupProps"
import type { SliderMark } from "../../../types/component/common/sliderProps"
import { Button } from "../../common/Button"
import { PresetGroup } from "../../common/PresetGroup"
import { Slider } from "../../common/Slider"
import { ReplicaStepper } from "../../dashboard/autoscaling/ReplicaStepper"
import { InfoCallout } from "../../common/InfoCallout"

const INSTANCE_SIZE_OPTIONS: PresetItem<InstanceSize>[] = [
    {
        id: "nano",
        label: "Nano (Eco)",
        badge: "0.25 vCPU",
        description: "250m CPU | 512 MiB RAM (Teszt / Fejlesztői)",
        value: "nano",
    },
    {
        id: "small",
        label: "Small (Alap)",
        badge: "0.5 vCPU",
        description: "500m CPU | 1 GiB RAM (Kis forgalmú üzemi)",
        value: "small",
    },
    {
        id: "medium",
        label: "Medium (Ajánlott)",
        badge: "1.0 vCPU",
        description: "1000m CPU | 2 GiB RAM (Stabil termelési)",
        value: "medium",
    },
    {
        id: "large",
        label: "Large (Vállalati)",
        badge: "2.0 vCPU",
        description: "2000m CPU | 4 GiB RAM (Nagy számításigény)",
        value: "large",
    },
]

const STRATEGY_OPTIONS: PresetItem<"hpa" | "vpa">[] = [
    {
        id: "hpa",
        label: "Horizontális Skálázás (HPA)",
        badge: "Ajánlott",
        description: "A podok számát növeli/csökkenti a terhelésre (1–15 példány között).",
        value: "hpa",
    },
    {
        id: "vpa",
        label: "Vertikális Méretezés (VPA)",
        badge: "Erőforrás-optimalizálás",
        description: "A meglévő pod CPU és RAM méretét bővíti dinamikusan a terhelésre.",
        value: "vpa",
    },
]

interface HpaPresetValue {
    min: number
    max: number
    cpu: number
}

const HPA_PRESETS: PresetItem<HpaPresetValue>[] = [
    {
        id: "eco",
        label: "Kímélő (Eco)",
        badge: "1-3 Pod",
        description: "80% CPU küszöb, gazdaságos",
        value: { min: 1, max: 3, cpu: 80 },
    },
    {
        id: "normal",
        label: "Kiegyensúlyozott",
        badge: "2-6 Pod",
        description: "70% CPU küszöb, ideális",
        value: { min: 2, max: 6, cpu: 70 },
    },
    {
        id: "peak",
        label: "Csúcsterhelés",
        badge: "3-10 Pod",
        description: "60% CPU küszöb, magas védelem",
        value: { min: 3, max: 10, cpu: 60 },
    },
]

const CPU_SLIDER_MARKS: SliderMark[] = [
    { value: 40, label: "40% (Érzékeny)" },
    { value: 60, label: "60%" },
    { value: 70, label: "70% (Ideális)" },
    { value: 90, label: "90% (Gazdaságos)" },
]

const SIZE_DETAILS: Record<InstanceSize, { requestsCpu: string; requestsRam: string; limitsCpu: string; limitsRam: string; desc: string }> = {
    nano: { requestsCpu: "250m", requestsRam: "512Mi", limitsCpu: "500m", limitsRam: "1024Mi", desc: "Fejlesztői és prototípus tesztelési környezetekhez ajánlott." },
    small: { requestsCpu: "500m", requestsRam: "1Gi", limitsCpu: "1000m", limitsRam: "2Gi", desc: "Kis vagy közepes terhelésű mikroszolgáltatások stabil alapmérete." },
    medium: { requestsCpu: "1000m", requestsRam: "2Gi", limitsCpu: "2000m", limitsRam: "4Gi", desc: "Nagy megbízhatóságú termelési környezetekhez, pufferelt kapacitással." },
    large: { requestsCpu: "2000m", requestsRam: "4Gi", limitsCpu: "4000m", limitsRam: "8Gi", desc: "Nagy adatfeldolgozási és intenzív memóriahasználatú rendszerekhez." },
}

const INACTIVATION_OPTIONS: PresetItem<InactivationStrategy>[] = [
    {
        id: "scale_to_zero",
        label: "Scale-to-Zero",
        badge: "0 MB RAM / FinOps",
        description: "Inaktív állapotban a podok leállnak 0 példányra (replicas: 0), 0 CPU és 0 MB RAM terheléssel. Bekapcsoláskor ~5-10 mp hidegindítás.",
        value: "scale_to_zero"
    },
    {
        id: "hot_standby",
        label: "Hot-Standby",
        badge: "0s Késleltetés",
        description: "A podok a háttérben futva maradnak készenlétben (1 példány), a routing kikerüli őket. Bekapcsoláskor azonnali, 0 másodperces rendelkezésre állás.",
        value: "hot_standby"
    }
]

export const AutoScalingStep = ({ data, onChange, disabled }: SetupStepComponentProps) => {
    const currentSize = data.instanceSize || "small"
    const sizeInfo = SIZE_DETAILS[currentSize] || SIZE_DETAILS.small

    const handleApplyHpaPreset = (preset: HpaPresetValue) => {
        onChange("minReplicas", preset.min)
        onChange("maxReplicas", preset.max)
        onChange("targetCpu", preset.cpu)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-cud-teal" />
                        Erőforrás-gazdálkodás & Skálázás
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Dinamikus terheléskövetés (HPA/VPA) vagy fix méretű dedikált példány (Static Sizing).
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant={data.autoscalingEnabled ? "primary" : "secondary"}
                        size="md"
                        onClick={() => onChange("autoscalingEnabled", true)}
                        disabled={disabled}
                    >
                        Automatikus Skálázás
                    </Button>
                    <Button
                        variant={!data.autoscalingEnabled ? "primary" : "secondary"}
                        size="md"
                        onClick={() => onChange("autoscalingEnabled", false)}
                        disabled={disabled}
                    >
                        Fix Példányméret
                    </Button>
                </div>
            </div>

            {!data.autoscalingEnabled && (
                <div className="flex flex-col gap-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner">
                    <PresetGroup
                        title="Statikus Példányméret (Instance Sizing)"
                        subtitle="Válaszd ki az 1 db futó pod számára lefoglalt processzor- és memóriamennyiséget"
                        options={INSTANCE_SIZE_OPTIONS}
                        selectedId={currentSize}
                        onSelect={(option) => onChange("instanceSize", option.value)}
                        columns={4}
                        accentColor="teal"
                        disabled={disabled}
                    />

                    <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Server className="w-3.5 h-3.5 text-cud-teal" />
                                Garantált Kubernetes Erőforrások (Requests & Limits)
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                                spec.replicas: 1
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                <span className="text-xs text-slate-400">Garantált CPU (Request):</span>
                                <span className="text-sm font-bold font-mono text-cud-teal">{sizeInfo.requestsCpu}</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                <span className="text-xs text-slate-400">Garantált Memória (Request):</span>
                                <span className="text-sm font-bold font-mono text-cud-teal">{sizeInfo.requestsRam}</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                <span className="text-xs text-slate-400">Maximális CPU (Limit):</span>
                                <span className="text-sm font-bold font-mono text-cud-skyblue">{sizeInfo.limitsCpu}</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                <span className="text-xs text-slate-400">Maximális Memória (Limit):</span>
                                <span className="text-sm font-bold font-mono text-cud-skyblue">{sizeInfo.limitsRam}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 mt-1">
                            <ShieldCheck className="w-4 h-4 text-cud-teal shrink-0" />
                            <span>
                                {sizeInfo.desc} A Kubernetes fürt automatikusan garantálja a dedikált kapacitást, kizárva a pod-flapping jelenséget és kiszámíthatóvá téve az erőforrás-felhasználást.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {data.autoscalingEnabled && (
                <div className="flex flex-col gap-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner">
                    <PresetGroup
                        title="Skálázási Stratégia Választó"
                        subtitle="Kölcsönösen kizáró stratégiák a pod flapping elkerülésére"
                        options={STRATEGY_OPTIONS}
                        selectedId={data.autoscalingStrategy}
                        onSelect={(option) => onChange("autoscalingStrategy", option.value)}
                        columns={2}
                        accentColor="teal"
                        disabled={disabled}
                    />

                    {data.autoscalingStrategy === "hpa" && (
                        <div className="flex flex-col gap-6 pt-2 border-t border-slate-800/60">
                            <PresetGroup
                                title="Gyors Skálázási Profilok"
                                subtitle="Ajánlott HPA terhelési konfigurációk"
                                options={HPA_PRESETS}
                                onSelect={(option) => handleApplyHpaPreset(option.value)}
                                columns={3}
                                accentColor="skyblue"
                                disabled={disabled}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ReplicaStepper
                                    title="Minimális Podok Száma"
                                    description="Garantált alap példányszám normál üzemben"
                                    value={data.minReplicas}
                                    min={1}
                                    max={5}
                                    unit="pod"
                                    color="teal"
                                    onChange={(val) => onChange("minReplicas", val)}
                                    disabled={disabled}
                                />
                                <ReplicaStepper
                                    title="Maximális Podok Száma"
                                    description="Csúcsidőszaki felső példányszám korlát"
                                    value={data.maxReplicas}
                                    min={data.minReplicas}
                                    max={15}
                                    unit="pod"
                                    color="orange"
                                    onChange={(val) => onChange("maxReplicas", val)}
                                    disabled={disabled}
                                />
                            </div>

                            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                            <Sliders className="w-4 h-4 text-cud-teal" />
                                            Célzott CPU Terhelési Küszöb (Target CPU Utilization)
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            Amikor a podok átlagos CPU használata átlépi ezt a szintet, a K8s új példányt indít.
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                        <span className="text-xs text-slate-400">Célérték:</span>
                                        <span className="text-sm font-bold font-mono text-cud-teal">
                                            {data.targetCpu}% CPU
                                        </span>
                                    </div>
                                </div>

                                <Slider
                                    value={data.targetCpu}
                                    min={40}
                                    max={90}
                                    step={5}
                                    onChange={(val) => onChange("targetCpu", val)}
                                    marks={CPU_SLIDER_MARKS}
                                    accentColor="teal"
                                    disabled={disabled}
                                    ariaLabel="Target CPU Slider"
                                />
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                                <Zap className="w-4 h-4 text-cud-teal shrink-0" />
                                <span>
                                    A platform automatikusan aktiválja a célalkalmazás HorizontalPodAutoscaler (HPA) erőforrását a fürtben, 15 másodperces metrika-lekérdezési ciklussal.
                                </span>
                            </div>
                        </div>
                    )}

                    {data.autoscalingStrategy === "vpa" && (
                        <div className="flex flex-col gap-4 pt-2 border-t border-slate-800/60">
                            <InfoCallout
                                title="Vertikális Skálázás (VPA) Üzemmód"
                                icon={<TrendingUp className="w-5 h-5 text-cud-teal" />}
                            >
                                <p>
                                    A Vertical Pod Autoscaler folyamatosan monitorozza a konténerek valós memóriafelhasználását és processzor-igényét.
                                    Amennyiben az alkalmazás memóriafogyasztása megnő, a VPA Admission Controller automatikusan megnöveli a pod erőforrás-korlátait, megakadályozva a memóriahiány miatti váratlan leállásokat (OOMKilled).
                                </p>
                            </InfoCallout>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                    <span className="text-xs text-slate-400">VPA Ajánlási Mód:</span>
                                    <span className="text-sm font-bold font-mono text-cud-teal">Auto (Dinamikus újraindítás)</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                    <span className="text-xs text-slate-400">Biztonsági Mérethatárok:</span>
                                    <span className="text-sm font-bold font-mono text-cud-skyblue">Min: 100m/256Mi | Max: 1000m/1Gi</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner flex flex-col gap-4">
                <PresetGroup<InactivationStrategy>
                    title="Kikapcsolási & Inaktiválási Stratégia"
                    subtitle="K8s FinOps Workload Profilok (Dual-Strategy)"
                    options={INACTIVATION_OPTIONS}
                    selectedId={data.inactivationStrategy || "scale_to_zero"}
                    onSelect={(option) => onChange("inactivationStrategy", option.value)}
                    columns={2}
                    accentColor={(data.inactivationStrategy || "scale_to_zero") === "scale_to_zero" ? "teal" : "skyblue"}
                    disabled={disabled}
                />

                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                    <Zap className="w-4 h-4 text-cud-orange shrink-0" />
                    <span>
                        Ez a beállítás lesz a klaszter alapértelmezett inaktiválási politikája, de a <strong>Funkciókapcsolók</strong> oldalon futásidőben bármikor egy kattintással átváltható.
                    </span>
                </div>
            </div>

        </div>
    )
}