import type { VpaCardProps } from "../../../types/component/autoscaling/vpaCardProps"
import type { PresetItem } from "../../../types/component/common/presetGroupProps"
import { Card } from "../../common/Card"
import { Button } from "../../common/Button"
import { Badge } from "../../common/Badge"
import { PresetGroup } from "../../common/PresetGroup"
import { InfoCallout } from "../../common/InfoCallout"
import { AlertTriangle, Cpu, HardDrive, RotateCcw, Save, Sparkles, TrendingUp } from "lucide-react"

const VPA_MODES: PresetItem<'Auto' | 'Off'>[] = [
    {
        id: 'Off',
        label: 'Off Mód (Megfigyelés)',
        badge: 'Biztonságos / Ajánlott',
        description: 'A VPA csak metrikákat gyűjt és ajánlásokat számol, nem indítja újra a futó konténereket.',
        value: 'Off',
    },
    {
        id: 'Auto',
        label: 'Auto Mód (Automatikus méretezés)',
        badge: 'Dinamikus újraindítás',
        description: 'A VPA Admission Controller azonnal újraindítja a podokat az optimális CPU/RAM méretekkel.',
        value: 'Auto',
    },
]

export const VpaCard = ({
    currentVpa,
    selectMode,
    selectMinCpu,
    selectMaxCpu,
    selectMinMemory,
    selectMaxMemory,
    onModeChange,
    onMinCpuChange,
    onMaxCpuChange,
    onMinMemoryChange,
    onMaxMemoryChange,
    onSave,
    isLoading,
}: VpaCardProps) => {
    const hasChanges = currentVpa !== null && (
        selectMode !== currentVpa.updateMode ||
        selectMinCpu !== (currentVpa.minAllowedCpu ?? '100m') ||
        selectMaxCpu !== (currentVpa.maxAllowedCpu ?? '1000m') ||
        selectMinMemory !== (currentVpa.minAllowedMemory ?? '128Mi') ||
        selectMaxMemory !== (currentVpa.maxAllowedMemory ?? '2Gi')
    )

    const handleReset = () => {
        if (!currentVpa) return
        onModeChange(currentVpa.updateMode)
        onMinCpuChange(currentVpa.minAllowedCpu ?? '100m')
        onMaxCpuChange(currentVpa.maxAllowedCpu ?? '1000m')
        onMinMemoryChange(currentVpa.minAllowedMemory ?? '128Mi')
        onMaxMemoryChange(currentVpa.maxAllowedMemory ?? '2Gi')
    }

    return (
        <Card
            title="Vertikális Pod Skálázás (VPA) Finomhangolása"
            subtitle="Automatikus erőforrás-igény (CPU & Memória) korrekció és ajánlások a valós futási metrikák alapján."
            hoverEffect={false}
            className="flex flex-col gap-6"
        >
            <PresetGroup
                title="VPA Működési Mód"
                subtitle="Válaszd ki az automatikus beavatkozás szintjét"
                options={VPA_MODES}
                selectedId={selectMode}
                onSelect={(preset) => onModeChange(preset.value)}
                disabled={isLoading}
                accentColor="purple"
                columns={2}
            />

            {selectMode === 'Auto' && (
                <div className="p-4 rounded-xl bg-cud-orange-bg border border-cud-orange-border flex items-start gap-3 text-xs text-cud-orange leading-relaxed">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold block mb-0.5">
                            Figyelem: VPA Auto mód kiválasztva (Versenyhelyzet kockázat)
                        </span>
                        A VPA Auto módban újraindítja a podokat, ha a mért terhelés eltér a foglalástól. Ha a CPU-alapú HPA is aktív, a két autoscaler ellenkező irányba próbálhatja skálázni az alkalmazást (Race Condition). Javasolt a HPA terheltségi küszöbének inaktiválása vagy a VPA Off módban tartása microservice-eknél.
                    </div>
                </div>
            )}

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-cud-purple" />
                            Megengedett Erőforrás-Tartományok (Resource Limits)
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            A VPA soha nem fog ezen határokon kívül eső CPU vagy memória kérést konfigurálni a podoknak.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasChanges ? (
                            <Badge variant="orange" size="sm" text="Módosítások mentésre várnak" />
                        ) : (
                            <Badge variant="purple" size="sm" text={`Mód: ${currentVpa?.updateMode ?? 'Off'}`} />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            <Cpu className="w-4 h-4 text-cud-teal" />
                            CPU Korlátok (Min / Max)
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">
                                    Min CPU kérés
                                </label>
                                <input
                                    type="text"
                                    value={selectMinCpu}
                                    onChange={(e) => onMinCpuChange(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="100m"
                                    className="w-full bg-slate-900 border  rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cud-teal transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">
                                    Max CPU kérés
                                </label>
                                <input
                                    type="text"
                                    value={selectMaxCpu}
                                    onChange={(e) => onMaxCpuChange(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="1000m"
                                    className="w-full bg-slate-900 border  rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cud-teal transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500">Gyors CPU:</span>
                            {['50m', '100m', '250m'].map((cpuVal) => (
                                <button
                                    key={cpuVal}
                                    type="button"
                                    onClick={() => onMinCpuChange(cpuVal)}
                                    disabled={isLoading}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 transition-colors"
                                >
                                    Min: {cpuVal}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            <HardDrive className="w-4 h-4 text-cud-purple" />
                            Memória Korlátok (Min / Max)
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">
                                    Min Memória kérés
                                </label>
                                <input
                                    type="text"
                                    value={selectMinMemory}
                                    onChange={(e) => onMinMemoryChange(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="128Mi"
                                    className="w-full bg-slate-900 border  rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cud-purple transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">
                                    Max Memória kérés
                                </label>
                                <input
                                    type="text"
                                    value={selectMaxMemory}
                                    onChange={(e) => onMaxMemoryChange(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="2Gi"
                                    className="w-full bg-slate-900 border  rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cud-purple transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500">Gyors RAM:</span>
                            {['128Mi', '256Mi', '512Mi'].map((memVal) => (
                                <button
                                    key={memVal}
                                    type="button"
                                    onClick={() => onMinMemoryChange(memVal)}
                                    disabled={isLoading}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 transition-colors"
                                >
                                    Min: {memVal}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cud-orange-bg text-cud-orange border border-cud-orange-border">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                            K8s VPA Recommender élő ajánlása
                        </span>
                        <p className="text-[11px] text-slate-400">
                            A mért tényleges pod-fogyasztási profil alapján az alábbi méretezést javasolja a vezérlősík:
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                    <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Javasolt CPU</span>
                        <span className="text-sm font-mono font-bold text-cud-teal">
                            {currentVpa?.targetCpu ?? '250m'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Javasolt RAM</span>
                        <span className="text-sm font-mono font-bold text-cud-orange">
                            {currentVpa?.targetMemory ?? '512Mi'}
                        </span>
                    </div>
                </div>
            </div>

            <InfoCallout title="Hogyan működik a Vertical Pod Autoscaler a háttérben?">
                A VPA három önálló mikroszolgáltatásból áll a K8s fürtben:
                <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-slate-400">
                    <li><strong className="text-slate-300 font-mono">Recommender:</strong> Elemzi az előzményadatokat és OOM (Out-of-Memory) hibákat megelőző kapacitást kalkulál.</li>
                    <li><strong className="text-slate-300 font-mono">Updater:</strong> Ha az Auto mód aktív, szabályozottan újraindítja a podokat az új értékek életbe léptetéséhez.</li>
                    <li><strong className="text-slate-300 font-mono">Admission Controller Webhook:</strong> Az újonnan induló podok definícióját repülés közben (in-flight) írja felül a kiszámolt értékekkel.</li>
                </ul>
            </InfoCallout>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                    {hasChanges && currentVpa && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<RotateCcw className="w-4 h-4" />}
                            onClick={handleReset}
                            disabled={isLoading}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            Visszaállítás ({currentVpa.updateMode})
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
                        Alkalmazás a VPA-ra
                    </Button>
                </div>
            </div>
        </Card>
    )
}
