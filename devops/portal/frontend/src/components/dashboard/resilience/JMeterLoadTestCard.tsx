import { useState, type FormEvent } from "react"
import { Gauge, Play } from "lucide-react"
import type { ResilienceScenario } from "../../../types/resilience"
import type { JMeterLoadTestCardProps } from "../../../types/component/resilience"
import { Card } from "../../common/Card"
import { Button } from "../../common/Button"
import { Slider } from "../../common/Slider"
import {
    DEFAULT_TARGET_HOST,
    DEFAULT_TARGET_PORT,
    RESILIENCE_SCENARIOS
} from "../../../constants/resilience"

export const JMeterLoadTestCard = ({ isStartingLoadTest, onStartLoadTest }: JMeterLoadTestCardProps) => {
    const [scenario, setScenario] = useState<ResilienceScenario>("baseline")
    const [threads, setThreads] = useState<number>(10)
    const [duration, setDuration] = useState<number>(60)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (isStartingLoadTest) return
        await onStartLoadTest({
            scenario,
            threads,
            duration,
            targetHost: DEFAULT_TARGET_HOST,
            targetPort: DEFAULT_TARGET_PORT
        })
    }

    const getSubmitButtonLabel = () => {
        if (isStartingLoadTest) {
            return "Job indítása a klaszteren..."
        }
        return "Terhelésteszt Indítása (K8s Job)"
    }

    const getScenarioCardClass = (isSelected: boolean, accentBorder: string, accentBg: string) => {
        if (isSelected) {
            return `${accentBorder} ${accentBg} shadow-md shadow-black/40`
        }
        return "border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-300"
    }

    return (
        <Card hoverEffect={false} className="flex flex-col gap-5 border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">Apache JMeter Terhelésteszt Indító</h3>
                        <p className="text-xs text-slate-400">Automatizált Kubernetes terhelésgeneráló Job konfigurálása és indítása</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Válassz Teszt Forgatókönyvet
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {RESILIENCE_SCENARIOS.map((item) => {
                            const isSelected = scenario === item.id
                            const cardClass = getScenarioCardClass(isSelected, item.accentBorder, item.accentBg)

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setScenario(item.id)}
                                    disabled={isStartingLoadTest}
                                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${cardClass}`}
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                            {item.icon}
                                        </div>
                                        {isSelected && (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border ${item.accentBorder} ${item.accentText}`}>
                                                Kiválasztva
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                                    <p className="text-xs font-medium text-slate-400 mb-1">{item.subtitle}</p>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-auto">{item.description}</p>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Párhuzamos Szálak (Threads)</span>
                            <span className="font-mono text-sm font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                                {threads} szál
                            </span>
                        </div>
                        <Slider
                            min={1}
                            max={50}
                            step={1}
                            value={threads}
                            onChange={setThreads}
                            accentColor="skyblue"
                            disabled={isStartingLoadTest}
                        />
                        <span className="text-[11px] text-slate-500">Párhuzamosan szimulált virtuális felhasználók száma (1 - 50)</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Teszt Időtartama (Duration)</span>
                            <span className="font-mono text-sm font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                                {duration} mp
                            </span>
                        </div>
                        <Slider
                            min={10}
                            max={180}
                            step={5}
                            value={duration}
                            onChange={setDuration}
                            accentColor="skyblue"
                            disabled={isStartingLoadTest}
                        />
                        <span className="text-[11px] text-slate-500">A terhelési fázis teljes hossza (10 - 180 másodperc)</span>
                    </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Célpont:</span>
                        <code className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-mono">
                            http://paas-portal-backend:{DEFAULT_TARGET_PORT}
                        </code>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        loading={isStartingLoadTest}
                        disabled={isStartingLoadTest}
                        icon={<Play className="w-4 h-4" />}
                        className="w-full sm:w-auto font-medium"
                    >
                        {getSubmitButtonLabel()}
                    </Button>
                </div>
            </form>
        </Card>
    )
}

