import { useEffect, useState } from "react"
import { K8sApi } from "../client/api/k8s"
import { TrafficStats } from "../components/dashboard/traffic/Stats"
import { RateLimitCard } from "../components/dashboard/traffic/RateLimitCard"
import { Button } from "../components/common/Button"
import { Activity, AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react"
import type { UpdateRateLimitDto } from "../types/k8s"

export const TrafficTab = () => {
    const [currentRps, setCurrentRps] = useState<number>(100)
    const [selectRps, setSelectRps] = useState<number>(100)
    const [currentBurst, setCurrentBurst] = useState<number>(5)
    const [selectBurst, setSelectBurst] = useState<number>(5)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [feedbackMessage, setFeedBackMessage] = useState<{ message: string, status: "error" | "success" } | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const fetchRateLimit = async () => {
        try {
            setIsLoading(true)
            const rateLimitConfig = await new K8sApi().getRateLimit()
            setCurrentRps(rateLimitConfig.rps)
            setSelectRps(rateLimitConfig.rps)
            setCurrentBurst(rateLimitConfig.burst ?? 5)
            setSelectBurst(rateLimitConfig.burst ?? 5)
            setLastUpdate(new Date())
        } catch (error) {
            setFeedBackMessage({
                message: "Hiba a forgalomkorlát lekérdezése során!",
                status: "error"
            })
            setTimeout(() => {
                setFeedBackMessage(null)
            }, 4000)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveRateLimit = async () => {
        try {
            setIsSaving(true)
            const request: UpdateRateLimitDto = {
                rps: selectRps,
                burst: selectBurst
            }
            await new K8sApi().updateRateLimit(request)
            setCurrentRps(selectRps)
            setCurrentBurst(selectBurst)
            setLastUpdate(new Date())
            setFeedBackMessage({
                message: `A kéréskorlát sikeresen frissítve az Ingress rétegen: ${selectRps} RPS (Puffer: ${selectBurst}x)`,
                status: "success"
            })
            setTimeout(() => {
                setFeedBackMessage(null)
            }, 4000)
        } catch (error) {
            setFeedBackMessage({
                message: "Hiba történt a beállítás mentése során!",
                status: "error"
            })
            setTimeout(() => {
                setFeedBackMessage(null)
            }, 4000)
        } finally {
            setIsSaving(false)
        }
    }

    useEffect(() => {
        fetchRateLimit()
    }, [])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <Activity className="w-6 h-6 text-cud-skyblue" />
                        Forgalom és Rate Limiting
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        NGINX Ingress kérés-szabályozás és RPS sávszélesség korlátozás valós időben.
                        {lastUpdate && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {lastUpdate.toLocaleTimeString("hu-HU")})
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isLoading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={fetchRateLimit}
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
                        onClick={() => setFeedBackMessage(null)}
                        className="opacity-70 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        aria-label="Értesítés bezárása"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <TrafficStats
                currentRps={currentRps}
                ingressName="mes-ingress"
                namespace="app-mes"
                burstMultiplier={currentBurst}
            />

            <RateLimitCard
                currentRps={currentRps}
                selectRps={selectRps}
                onRpsChange={setSelectRps}
                currentBurst={currentBurst}
                selectBurst={selectBurst}
                onBurstChange={setSelectBurst}
                onSave={handleSaveRateLimit}
                isLoading={isSaving}
            />
        </div>
    )
}