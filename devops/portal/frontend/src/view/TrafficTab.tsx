import { useTraffic } from "../hooks/useTraffic"
import type { TrafficSubTab, TrafficTabProps } from "../types/traffic"
import { TRAFFIC_TAB_OPTIONS } from "../constants/traffic"
import { TrafficStats } from "../components/dashboard/traffic/Stats"
import { RateLimitCard } from "../components/dashboard/traffic/RateLimitCard"
import { AutoscalingStats } from "../components/dashboard/autoscaling/Stats"
import { HpaCard } from "../components/dashboard/autoscaling/HpaCard"
import { VpaCard } from "../components/dashboard/autoscaling/VpaCard"
import { Button } from "../components/common/Button"
import { SegmentedControl } from "../components/common/SegmentedControl"
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"

export const TrafficTab = ({ initialTab = "ingress" }: TrafficTabProps) => {
    const {
        activeTab,
        handleTabChange,
        currentRps,
        selectRps,
        setSelectRps,
        currentBurst,
        selectBurst,
        setSelectBurst,
        isSavingRateLimit,
        saveRateLimit,
        currentHpa,
        selectMinReplicas,
        setSelectMinReplicas,
        selectMaxReplicas,
        setSelectMaxReplicas,
        selectTargetCpu,
        setSelectTargetCpu,
        isSavingHpa,
        saveHpa,
        currentVpa,
        selectMode,
        setSelectMode,
        selectMinCpu,
        setSelectMinCpu,
        selectMaxCpu,
        setSelectMaxCpu,
        selectMinMemory,
        setSelectMinMemory,
        selectMaxMemory,
        setSelectMaxMemory,
        isSavingVpa,
        saveVpa,
        isGlobalLoading,
        toastMessage,
        setToastMessage,
        lastUpdate,
        refreshAll
    } = useTraffic(initialTab)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <Activity className="w-6 h-6 text-cud-skyblue" />
                        Forgalom & Skálázás
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Ingress sebességkorlátozás, horizontális pod-skálázás (HPA) és erőforrás-ajánlások egy felületen.
                        {lastUpdate && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {lastUpdate.toLocaleTimeString("hu-HU")})
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <SegmentedControl<TrafficSubTab>
                        value={activeTab}
                        onChange={handleTabChange}
                        options={TRAFFIC_TAB_OPTIONS}
                        layout="pill"
                    />

                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isGlobalLoading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={refreshAll}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>

            {activeTab === "ingress" && (
                <div className="flex flex-col gap-6">
                    <TrafficStats
                        currentRps={currentRps}
                        burstMultiplier={currentBurst}
                        ingressName="mes-ingress"
                        namespace="app-mes"
                    />

                    <RateLimitCard
                        currentRps={currentRps}
                        selectRps={selectRps}
                        onRpsChange={setSelectRps}
                        currentBurst={currentBurst}
                        selectBurst={selectBurst}
                        onBurstChange={setSelectBurst}
                        onSave={saveRateLimit}
                        isLoading={isSavingRateLimit}
                    />
                </div>
            )}

            {activeTab === "hpa" && (
                <div className="flex flex-col gap-6">
                    <AutoscalingStats
                        strategy="hpa"
                        hpa={currentHpa}
                        vpa={currentVpa}
                        isLoading={isGlobalLoading}
                    />

                    <HpaCard
                        currentHpa={currentHpa}
                        selectMinReplicas={selectMinReplicas}
                        selectMaxReplicas={selectMaxReplicas}
                        selectTargetCpu={selectTargetCpu}
                        onMinReplicasChange={setSelectMinReplicas}
                        onMaxReplicasChange={setSelectMaxReplicas}
                        onTargetCpuChange={setSelectTargetCpu}
                        onSave={saveHpa}
                        isLoading={isSavingHpa}
                    />
                </div>
            )}

            {activeTab === "vpa" && (
                <div className="flex flex-col gap-6">
                    <AutoscalingStats
                        strategy="vpa"
                        hpa={currentHpa}
                        vpa={currentVpa}
                        isLoading={isGlobalLoading}
                    />

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
                        onSave={saveVpa}
                        isLoading={isSavingVpa}
                    />
                </div>
            )}

            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${toastMessage.type === "success"
                            ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                            : "bg-rose-950/90 border-rose-500/50 text-rose-200"
                        }`}
                >
                    {toastMessage.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    )}
                    <span>{toastMessage.text}</span>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="ml-2 text-xs opacity-60 hover:opacity-100 hover:scale-110 transition-all cursor-pointer p-0.5"
                        title="Bezárás"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    )
}