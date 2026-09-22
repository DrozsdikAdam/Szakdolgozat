import type { HpaCardProps } from "../../../types/component/autoscaling/hpaCardProps"
import type { PresetItem } from "../../../types/component/common/presetGroupProps"
import { Card } from "../../common/Card"
import { Button } from "../../common/Button"
import { Badge } from "../../common/Badge"
import { Slider } from "../../common/Slider"
import { PresetGroup } from "../../common/PresetGroup"
import { InfoCallout } from "../../common/InfoCallout"
import { ReplicaStepper } from "./ReplicaStepper"
import { AlertTriangle, Cpu, Layers, RotateCcw, Save } from "lucide-react"

interface HpaPresetValue {
    min: number
    max: number
    cpu: number
}

const HPA_PRESETS: PresetItem<HpaPresetValue>[] = [
    { id: "eco", label: "Kímélő / Eco", description: "Min: 1, Max: 3 (80% CPU)", value: { min: 1, max: 3, cpu: 80 } },
    { id: "normal", label: "Normál Üzemi", description: "Min: 2, Max: 6 (75% CPU)", value: { min: 2, max: 6, cpu: 75 } },
    { id: "high", label: "Nagy Forgalom", description: "Min: 3, Max: 10 (65% CPU)", value: { min: 3, max: 10, cpu: 65 } },
    { id: "peak", label: "Csúcsidő / Max", description: "Min: 4, Max: 15 (50% CPU)", value: { min: 4, max: 15, cpu: 50 } },
]

const SLIDER_MARKS = [
    { value: 20, label: "20% (Min)" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 95, label: "95% (Max)" },
]

export const HpaCard = ({ currentHpa, selectMinReplicas, selectMaxReplicas, selectTargetCpu, onMinReplicasChange, onMaxReplicasChange, onTargetCpuChange, onSave, isLoading, }: HpaCardProps) => {
    const hasChanges = currentHpa !== null && (
        selectMinReplicas !== currentHpa.minReplicas ||
        selectMaxReplicas !== currentHpa.maxReplicas ||
        selectTargetCpu !== currentHpa.targetCpuUtil
    )

    const isOrderValid = selectMinReplicas <= selectMaxReplicas
    const isValid = selectMinReplicas >= 1 && isOrderValid

    const currentPresetId = HPA_PRESETS.find(
        (p) =>
            p.value.min === selectMinReplicas &&
            p.value.max === selectMaxReplicas &&
            p.value.cpu === selectTargetCpu
    )?.id ?? null

    const handleApplyPreset = (value: HpaPresetValue) => {
        onMinReplicasChange(value.min)
        onMaxReplicasChange(value.max)
        onTargetCpuChange(value.cpu)
    }

    const handleReset = () => {
        if (!currentHpa) return
        onMinReplicasChange(currentHpa.minReplicas)
        onMaxReplicasChange(currentHpa.maxReplicas)
        onTargetCpuChange(currentHpa.targetCpuUtil)
    }

    return (
        <Card
            title="Horizontális Pod Skálázás (HPA) Finomhangolása"
            subtitle="Dinamikus pod-példányszám növelés és csökkentés a mért CPU terheltség függvényében (K8s HPA v2)."
            hoverEffect={false}
            className="flex flex-col gap-6"
        >
            <PresetGroup
                title="Gyors Beállítási Profilok"
                subtitle="Ajánlott terhelési konfigurációk"
                options={HPA_PRESETS}
                selectedId={currentPresetId}
                onSelect={(preset) => handleApplyPreset(preset.value)}
                disabled={isLoading}
                accentColor="skyblue"
            />

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cud-skyblue" />
                            Pod Replikaszám Határok (Min / Max)
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Meghatározza a futtatható pod példányok alsó és felső korlátját a fürtben.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentHpa && (
                            hasChanges ? (
                                <Badge
                                    variant="orange"
                                    size="sm"
                                    text={`Módosítás: ${currentHpa.minReplicas}-${currentHpa.maxReplicas} ➔ ${selectMinReplicas}-${selectMaxReplicas} pod`}
                                />
                            ) : (
                                <Badge
                                    variant="teal"
                                    size="sm"
                                    text={`Szinkronban: ${currentHpa.minReplicas}-${currentHpa.maxReplicas} pod`}
                                />
                            )
                        )}
                        <span className="text-2xl font-extrabold text-cud-skyblue font-mono">
                            {selectMinReplicas} – {selectMaxReplicas}{" "}
                            <span className="text-xs font-normal text-slate-400">
                                db
                            </span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <ReplicaStepper
                        title="Minimum Replikák"
                        description="Garantált podok száma még nulla forgalom esetén is."
                        value={selectMinReplicas}
                        min={1}
                        max={10}
                        color="teal"
                        onChange={onMinReplicasChange}
                        disabled={isLoading}
                    />
                    <ReplicaStepper
                        title="Maximum Replikák"
                        description="Felső plafon, megvédi a klasztert a túlterheléstől."
                        value={selectMaxReplicas}
                        min={2}
                        max={20}
                        color="orange"
                        onChange={onMaxReplicasChange}
                        disabled={isLoading}
                    />
                </div>

                {!isOrderValid && (
                    <div className="p-3 rounded-lg bg-cud-vermillon-bg border border-cud-vermillon-border flex items-center gap-2 text-xs text-cud-vermillon">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>A minimális replikaszám ({selectMinReplicas}) nem haladhatja meg a maximális replikaszámot ({selectMaxReplicas})!</span>
                    </div>
                )}
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-cud-teal" />
                            Cél CPU Kihasználtsági Küszöb (Target CPU Utilization)
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Ha a podok átlagos CPU használata átlépi ezt az értéket, a HPA automatikusan felskáláz.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentHpa && (
                            selectTargetCpu !== currentHpa.targetCpuUtil ? (
                                <Badge
                                    variant="orange"
                                    size="sm"
                                    text={`Módosítás: ${currentHpa.targetCpuUtil}% ➔ ${selectTargetCpu}%`}
                                />
                            ) : (
                                <Badge
                                    variant="teal"
                                    size="sm"
                                    text={`Szinkronban: ${currentHpa.targetCpuUtil}%`}
                                />
                            )
                        )}
                        <span className="text-3xl font-extrabold text-cud-teal font-mono">
                            {selectTargetCpu}%
                        </span>
                    </div>
                </div>

                <Slider
                    value={selectTargetCpu}
                    min={20}
                    max={95}
                    step={5}
                    marks={SLIDER_MARKS}
                    accentColor="teal"
                    onChange={onTargetCpuChange}
                    disabled={isLoading}
                    ariaLabel="Cél CPU küszöbérték beállítása"
                />

                <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Skálázási logika:</span>
                        <span className="font-mono text-slate-200">
                            Ha az átlagos CPU &gt; <strong className="text-cud-teal">{selectTargetCpu}%</strong>, új pod indul (max: <strong className="text-cud-orange">{selectMaxReplicas}</strong> podig).
                        </span>
                    </div>
                    {currentHpa?.currentCpuPercent !== undefined && (
                        <span className="text-slate-400 hidden sm:inline font-mono">
                            Jelenlegi mért terhelés: <strong className="text-cud-skyblue">~{currentHpa.currentCpuPercent}%</strong>
                        </span>
                    )}
                </div>
            </div>

            <InfoCallout title="Hogyan számol a Kubernetes Horizontal Pod Autoscaler?">
                A vezérlősík (Kube-Controller-Manager) 15 másodpercenként lekéri a metrikákat a Metrics Servertől:
                <div className="my-1.5 font-mono text-xs text-cud-teal bg-slate-800/80 px-2.5 py-1 rounded inline-block">
                    kívánt_replikák = ceil[ jelenlegi_replikák × (mért_cpu / cél_cpu) ]
                </div>
                A módosítás a <code className="text-cud-skyblue font-mono">mes-backend-hpa</code> erőforrásban érvényesül azonnal.
            </InfoCallout>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                    {hasChanges && currentHpa && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<RotateCcw className="w-4 h-4" />}
                            onClick={handleReset}
                            disabled={isLoading}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            Visszaállítás ({currentHpa.minReplicas}-{currentHpa.maxReplicas} pod, {currentHpa.targetCpuUtil}%)
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        loading={isLoading}
                        disabled={!hasChanges || !isValid || isLoading}
                        icon={<Save className="w-4 h-4" />}
                        onClick={onSave}
                    >
                        Alkalmazás a HPA-ra
                    </Button>
                </div>
            </div>
        </Card>
    )
}
