import { useEffect, useState } from "react"
import { K8sApi } from "../client/api/k8s"
import type { UpdateHpaDto, VpaOverviewDto } from "../types/k8s"
import { AutoscalingStats } from "../components/dashboard/autoscaling/Stats"
import { HpaCard } from "../components/dashboard/autoscaling/HpaCard"
import { VpaCard } from "../components/dashboard/autoscaling/VpaCard"
import { Button } from "../components/common/Button"
import { Badge } from "../components/common/Badge"
import { AlertCircle, CheckCircle2, Cpu, RefreshCw, TrendingUp, X } from "lucide-react"

export const AutoscalingTab = () => {
    const [activeStrategy, setActiveStrategy] = useState<'hpa' | 'vpa'>('hpa')

    const [currentHpa, setCurrentHpa] = useState<UpdateHpaDto | null>(null)
    const [selectMinReplicas, setSelectMinReplicas] = useState<number>(2)
    const [selectMaxReplicas, setSelectMaxReplicas] = useState<number>(10)
    const [selectTargetCpu, setSelectTargetCpu] = useState<number>(80)

    const [currentVpa, setCurrentVpa] = useState<VpaOverviewDto | null>(null)
    const [selectMode, setSelectMode] = useState<'Auto' | 'Off'>('Off')
    const [selectMinCpu, setSelectMinCpu] = useState<string>('100m')
    const [selectMaxCpu, setSelectMaxCpu] = useState<string>('1000m')
    const [selectMinMemory, setSelectMinMemory] = useState<string>('128Mi')
    const [selectMaxMemory, setSelectMaxMemory] = useState<string>('2Gi')

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isSavingHpa, setIsSavingHpa] = useState<boolean>(false)
    const [isSavingVpa, setIsSavingVpa] = useState<boolean>(false)
    const [feedbackMessage, setFeedbackMessage] = useState<{ message: string; status: 'error' | 'success' } | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const fetchAutoscaling = async () => {
        try {
            setIsLoading(true)
            const api = new K8sApi()
            const [hpaData, vpaData] = await Promise.all([
                api.getHpa(),
                api.getVpa(),
            ])

            setCurrentHpa(hpaData)
            setSelectMinReplicas(hpaData.minReplicas)
            setSelectMaxReplicas(hpaData.maxReplicas)
            setSelectTargetCpu(hpaData.targetCpuUtil)

            setCurrentVpa(vpaData)
            setSelectMode(vpaData.updateMode ?? 'Off')
            setSelectMinCpu(vpaData.minAllowedCpu ?? '100m')
            setSelectMaxCpu(vpaData.maxAllowedCpu ?? '1000m')
            setSelectMinMemory(vpaData.minAllowedMemory ?? '128Mi')
            setSelectMaxMemory(vpaData.maxAllowedMemory ?? '2Gi')

            setLastUpdate(new Date())
        } catch (error) {
            setFeedbackMessage({
                message: "Hiba az autoscaling adatok lekérdezése során!",
                status: "error"
            })
            setTimeout(() => setFeedbackMessage(null), 4000)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveHpa = async () => {
        try {
            setIsSavingHpa(true)
            await new K8sApi().updateHpa({
                minReplicas: selectMinReplicas,
                maxReplicas: selectMaxReplicas,
                targetCpuUtil: selectTargetCpu,
                currentReplicas: currentHpa?.currentReplicas ?? selectMinReplicas,
            })

            setCurrentHpa((prev) =>
                prev
                    ? {
                        ...prev,
                        minReplicas: selectMinReplicas,
                        maxReplicas: selectMaxReplicas,
                        targetCpuUtil: selectTargetCpu,
                    }
                    : null
            )
            setLastUpdate(new Date())
            setFeedbackMessage({
                message: `HPA beállítások sikeresen frissítve: Min: ${selectMinReplicas}, Max: ${selectMaxReplicas}, Cél CPU: ${selectTargetCpu}%`,
                status: "success"
            })
            setTimeout(() => setFeedbackMessage(null), 4000)
        } catch (error) {
            setFeedbackMessage({
                message: "Hiba történt a HPA határok mentése során!",
                status: "error"
            })
            setTimeout(() => setFeedbackMessage(null), 4000)
        } finally {
            setIsSavingHpa(false)
        }
    }

    const handleSaveVpa = async () => {
        try {
            setIsSavingVpa(true)
            await new K8sApi().updateVpa({
                updateMode: selectMode,
                minAllowedCpu: selectMinCpu,
                maxAllowedCpu: selectMaxCpu,
                minAllowedMemory: selectMinMemory,
                maxAllowedMemory: selectMaxMemory,
            })

            setCurrentVpa((prev) =>
                prev
                    ? {
                        ...prev,
                        updateMode: selectMode,
                        minAllowedCpu: selectMinCpu,
                        maxAllowedCpu: selectMaxCpu,
                        minAllowedMemory: selectMinMemory,
                        maxAllowedMemory: selectMaxMemory,
                    }
                    : null
            )
            setLastUpdate(new Date())
            setFeedbackMessage({
                message: `VPA konfiguráció sikeresen elmentve: ${selectMode} mód (${selectMinCpu}-${selectMaxCpu} CPU, ${selectMinMemory}-${selectMaxMemory} RAM)`,
                status: "success"
            })
            setTimeout(() => setFeedbackMessage(null), 4000)
        } catch (error) {
            setFeedbackMessage({
                message: "Hiba történt a VPA konfiguráció mentése során!",
                status: "error"
            })
            setTimeout(() => setFeedbackMessage(null), 4000)
        } finally {
            setIsSavingVpa(false)
        }
    }

    useEffect(() => {
        fetchAutoscaling()
    }, [])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        {activeStrategy === 'hpa' ? (
                            <Cpu className="w-6 h-6 text-cud-teal" />
                        ) : (
                            <TrendingUp className="w-6 h-6 text-cud-purple" />
                        )}
                        Automatikus Skálázás
                        <Badge
                            variant={activeStrategy === 'hpa' ? 'teal' : 'purple'}
                            size="sm"
                            text={activeStrategy === 'hpa' ? 'HPA Aktív' : 'VPA Aktív'}
                        />
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {activeStrategy === 'hpa'
                            ? "Horizontális pod-példányszám szabályozás CPU terhelés alapján (K8s HPA)."
                            : "Vertikális erőforrás-korrekció és konténer méret ajánlások (K8s VPA)."}
                        {lastUpdate && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {lastUpdate.toLocaleTimeString("hu-HU")})
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setActiveStrategy('hpa')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeStrategy === 'hpa'
                                ? 'bg-cud-teal-bg text-cud-teal border border-cud-teal-border shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <Cpu className="w-4 h-4" />
                            Horizontális (HPA)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveStrategy('vpa')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeStrategy === 'vpa'
                                ? 'bg-cud-purple-bg text-cud-purple border border-cud-purple-border shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Vertikális (VPA)
                        </button>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isLoading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={fetchAutoscaling}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>

            {feedbackMessage && (
                <div
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${feedbackMessage.status === "error"
                        ? "bg-cud-vermillon-bg text-cud-vermillon border-cud-vermillon-border"
                        : "bg-cud-teal-bg text-cud-teal border-cud-teal-border"
                        }`}
                >
                    <div className="flex items-center gap-2.5 text-sm font-medium">
                        {feedbackMessage.status === "error" ? (
                            <AlertCircle className="w-5 h-5 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                        )}
                        <span>{feedbackMessage.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedbackMessage(null)}
                        className="opacity-70 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        aria-label="Értesítés bezárása"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <AutoscalingStats
                strategy={activeStrategy}
                hpa={currentHpa}
                vpa={currentVpa}
                isLoading={isLoading}
            />

            {activeStrategy === 'hpa' ? (
                <HpaCard
                    currentHpa={currentHpa}
                    selectMinReplicas={selectMinReplicas}
                    selectMaxReplicas={selectMaxReplicas}
                    selectTargetCpu={selectTargetCpu}
                    onMinReplicasChange={setSelectMinReplicas}
                    onMaxReplicasChange={setSelectMaxReplicas}
                    onTargetCpuChange={setSelectTargetCpu}
                    onSave={handleSaveHpa}
                    isLoading={isSavingHpa || isLoading}
                />
            ) : (
                <VpaCard
                    currentVpa={currentVpa}
                    selectMode={selectMode}
                    selectMinCpu={selectMinCpu}
                    selectMaxCpu={selectMaxCpu}
                    selectMinMemory={selectMinMemory}
                    selectMaxMemory={selectMaxMemory}
                    onModeChange={setSelectMode}
                    onMinCpuChange={setSelectMinCpu}
                    onMaxCpuChange={setSelectMaxCpu}
                    onMinMemoryChange={setSelectMinMemory}
                    onMaxMemoryChange={setSelectMaxMemory}
                    onSave={handleSaveVpa}
                    isLoading={isSavingVpa || isLoading}
                />
            )}
        </div>
    )
}
