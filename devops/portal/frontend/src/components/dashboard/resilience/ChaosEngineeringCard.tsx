import { useState, type FormEvent } from "react"
import { AlertTriangle, CheckCircle2, Flame, Loader2, Sparkles, Timer } from "lucide-react"
import type { ChaosEngineeringCardProps } from "../../../types/component/resilience"
import { Card } from "../../common/Card"
import { Button } from "../../common/Button"
import { Input } from "../../common/Input"
import { DEFAULT_RESILIENCE_NAMESPACE, QUICK_POD_PRESETS } from "../../../constants/resilience"

export const ChaosEngineeringCard = ({ isKillingPod, activeExperimentId, chaosTimerSeconds, onTriggerPodKill, recentExperiments }: ChaosEngineeringCardProps) => {
    const [namespace, setNamespace] = useState<string>(DEFAULT_RESILIENCE_NAMESPACE)
    const [podName, setPodName] = useState<string>("")

    const isRunning = activeExperimentId !== null
    const lastExperiment = recentExperiments?.[0]

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!podName.trim() || !namespace.trim() || isKillingPod || isRunning) return
        await onTriggerPodKill({
            namespace: namespace.trim(),
            podName: podName.trim()
        })
    }

    const setQuickPod = (name: string) => {
        setPodName(name)
        setNamespace(DEFAULT_RESILIENCE_NAMESPACE)
    }

    const getSubmitButtonText = () => {
        if (isKillingPod) {
            return "Pod leállítása..."
        }
        return "Pod Leállítása (Chaos Pod Kill)"
    }

    const renderActiveExperimentBanner = () => (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber-200">Öngyógyulás mérése folyamatban...</p>
                    <p className="text-xs text-amber-300/80">Várakozás az új pod Running és Ready állapotára a klaszteren</p>
                </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-lg border border-amber-500/30">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-lg font-bold text-amber-300">{chaosTimerSeconds} mp</span>
            </div>
        </div>
    )

    const renderRecoveredBanner = () => {
        if (!lastExperiment) {
            return null
        }

        return (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-emerald-200">Sikeres öngyógyulás igazolva!</p>
                        <p className="text-xs text-emerald-400/80">Pod: {lastExperiment.podName} ({lastExperiment.namespace})</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-emerald-500/30">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">Mért RTO:</span>
                    <span className="font-mono text-sm font-bold text-emerald-300">{lastExperiment.recoveryTimeSeconds} mp</span>
                </div>
            </div>
        )
    }

    const renderExperimentStatus = () => {
        if (isRunning) {
            return renderActiveExperimentBanner()
        }

        if (lastExperiment?.status === "RECOVERED") {
            return renderRecoveredBanner()
        }

        return null
    }

    return (
        <Card hoverEffect={false} className="flex flex-col gap-5 border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Flame className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">Káosztervezés & Pod Kill Kísérlet</h3>
                        <p className="text-xs text-slate-400">Kubernetes pod leállítása és automatikus öngyógyulási (RTO) idő mérése</p>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p>
                    A pod leállítása után a Kubernetes ReplicaSet azonnal új podot indít. A rendszer másodperc alapú stopperrel
                    méri a kieséstől a kész állapotig eltelt helyreállítási időt (RTO).
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Kubernetes Névtér"
                        value={namespace}
                        onChange={setNamespace}
                        placeholder={`pl. ${DEFAULT_RESILIENCE_NAMESPACE}`}
                        disabled={isKillingPod || isRunning}
                        accentColor="orange"
                    />

                    <Input
                        label="Célzott Pod Neve"
                        value={podName}
                        onChange={setPodName}
                        placeholder="pl. paas-portal-backend-..."
                        disabled={isKillingPod || isRunning}
                        accentColor="orange"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span className="text-slate-500">Gyorskitöltés:</span>
                    {QUICK_POD_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => setQuickPod(preset)}
                            disabled={isKillingPod || isRunning}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                <div className="pt-1">
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isKillingPod}
                        disabled={!podName.trim() || !namespace.trim() || isKillingPod || isRunning}
                        icon={<Flame className="w-4 h-4" />}
                        className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-medium"
                    >
                        {getSubmitButtonText()}
                    </Button>
                </div>
            </form>

            {renderExperimentStatus()}
        </Card>
    )
}

