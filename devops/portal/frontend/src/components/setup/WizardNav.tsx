import type { WizardNavProps } from "../../types/component/setup/setupStepProps"
import { Button } from "../common/Button"
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Rocket } from "lucide-react"

const NAV_ITEMS = [
    { id: 1, label: 'Git & GitOps' },
    { id: 2, label: 'Adatbázis' },
    { id: 3, label: 'Tárhely & S3' },
    { id: 4, label: 'Forgalomkorlát' },
    { id: 5, label: 'Skálázás' },
    { id: 6, label: 'Összegzés' },
]

export const WizardNav = ({ currentStep, totalSteps, onNext, onPrev, onGoToStep, isLoading = false, isLastStep, isFirstStep, children }: WizardNavProps) => {

    const currentTitle = NAV_ITEMS.find((item) => item.id === currentStep)?.label ?? ""

    return (
        <div className="flex flex-col w-full gap-6">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = currentStep === item.id
                        const isCompleted = currentStep > item.id

                        let stateStyle = "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                        if (isActive) {
                            stateStyle = "bg-cud-skyblue/10 border-cud-skyblue text-cud-skyblue shadow-lg shadow-cud-skyblue/10 font-bold"
                        } else if (isCompleted) {
                            stateStyle = "bg-slate-900/80 border-slate-700/70 text-slate-300 hover:border-cud-teal/60"
                        }

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onGoToStep(item.id)}
                                disabled={isLoading}
                                className={`px-3 py-2.5 rounded-xl border flex items-center gap-2.5 text-left text-xs transition-all duration-150 cursor-pointer ${stateStyle}`}
                            >
                                <div className="shrink-0">
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-cud-teal" />
                                    ) : isActive ? (
                                        <div className="w-5 h-5 rounded-full bg-cud-skyblue text-slate-950 text-[11px] font-extrabold flex items-center justify-center font-mono">
                                            {item.id}
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-semibold flex items-center justify-center font-mono">
                                            {item.id}
                                        </div>
                                    )}
                                </div>

                                <span className={`truncate ${isActive ? "text-slate-100" : isCompleted ? "text-slate-200" : "text-slate-400"}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin text-cud-skyblue mb-2" />
                    <p className="text-xs font-medium font-mono">Konfiguráció szinkronizálása a háttérben...</p>
                </div>
            )}

            {children}

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                    {!isFirstStep && (
                        <Button
                            variant="secondary"
                            size="md"
                            icon={<ChevronLeft className="w-4 h-4" />}
                            onClick={onPrev}
                            disabled={isLoading}
                        >
                            Vissza
                        </Button>
                    )}
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <span>Lépés:</span>
                    <strong className="text-cud-skyblue font-bold">{currentStep}</strong>
                    <span>/</span>
                    <span>{totalSteps}</span>
                    <span className="hidden sm:inline text-slate-500 font-sans">
                        – {currentTitle}
                    </span>
                </div>

                <div>
                    {isLastStep ? (
                        <Button
                            variant="primary"
                            size="md"
                            icon={<Rocket className="w-4 h-4" />}
                            onClick={onNext}
                            disabled={isLoading}
                            className="bg-cud-teal hover:bg-cud-teal/90 text-slate-950 font-bold shadow-lg shadow-cud-teal/20"
                        >
                            Platform Inicializálása
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="md"
                            icon={<ChevronRight className="w-4 h-4" />}
                            onClick={onNext}
                            disabled={isLoading}
                        >
                            Következő lépés
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}