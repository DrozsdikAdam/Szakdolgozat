import { useState, useEffect } from "react";
import { Sliders, RefreshCw, Layers, Zap, Info } from "lucide-react";
import type { DeploymentStrategy } from "../../../types/deployments";
import type { DeploymentStrategyModalProps } from "../../../types/component/deployments/deploymentStrategyModalProps";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";

export const DeploymentStrategyModal = ({ isOpen, onClose, workload, onSave, isSaving }: DeploymentStrategyModalProps) => {
    const [strategy, setStrategy] = useState<DeploymentStrategy>("RollingUpdate");
    const [canaryWeight, setCanaryWeight] = useState<number>(20);

    useEffect(() => {
        if (!isOpen || !workload) return;
        setStrategy(workload.strategy || "RollingUpdate");
        setCanaryWeight(workload.canaryWeight ?? 20);
    }, [isOpen, workload]);

    if (!workload) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            deploymentName: workload.name,
            namespace: workload.namespace,
            strategy,
            canaryWeight: strategy === "Canary" ? canaryWeight : undefined
        });
    };

    const strategies: { id: DeploymentStrategy; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
        {
            id: "RollingUpdate",
            label: "Gördülő Frissítés (Rolling Update)",
            desc: "Fokozatos pod-csere leállás nélkül (Zero-Downtime). Ideális standard mikroszervizekhez.",
            icon: <RefreshCw className="w-4 h-4 text-cud-skyblue" />,
            color: "border-cud-skyblue/40 bg-cud-skyblue/10"
        },
        {
            id: "BlueGreen",
            label: "Kék / Zöld Telepítés (Blue / Green)",
            desc: "Párhuzamos környezetek futtatása. Az új verzió tesztelése után a forgalom egy gombnyomással átkapcsol.",
            icon: <Layers className="w-4 h-4 text-cud-teal" />,
            color: "border-cud-teal/40 bg-cud-teal/10"
        },
        {
            id: "Canary",
            label: "Canary Kiadás (Lépcsőzetes Forgalom)",
            desc: "Az éles forgalom csak egy kis százaléka (pl. 20%) kapja az új verziót. Hibamentesség esetén a súly növelhető.",
            icon: <Zap className="w-4 h-4 text-cud-orange" />,
            color: "border-cud-orange/40 bg-cud-orange/10"
        }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Telepítési Stratégia — ${workload.name}`}
            subtitle={`${workload.namespace} névtér · jelenlegi verzió: ${workload.currentImage}`}
            icon={<Sliders className="w-5 h-5 text-cud-skyblue" />}
            maxWidth="xl"
            footer={
                <div className="flex items-center justify-between w-full p-2">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>A módosítás a következő rollouttól lép érvénybe.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Mégse
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleSubmit}
                            loading={isSaving}
                            disabled={isSaving}
                        >
                            Stratégia Alkalmazása
                        </Button>
                    </div>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Válassz Telepítési Stratégiát
                </label>

                <div className="space-y-2.5">
                    {strategies.map((s) => {
                        const isSelected = strategy === s.id;
                        return (
                            <div
                                key={s.id}
                                onClick={() => setStrategy(s.id)}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${isSelected
                                    ? `${s.color} border-opacity-100 shadow-md`
                                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                                    }`}
                            >
                                <div className="mt-0.5 shrink-0">{s.icon}</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-100">
                                            {s.label}
                                        </span>
                                        {isSelected && (
                                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-slate-900 text-slate-200 border border-slate-700">
                                                Kiválasztva
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {s.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {strategy === "Canary" && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-cud-orange/30 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-cud-orange" />
                                <span>Kezdeti Canary Forgalom Súlya:</span>
                            </span>
                            <span className="font-mono text-sm font-bold text-cud-orange">
                                {canaryWeight}%
                            </span>
                        </div>

                        <input
                            type="range"
                            min="5"
                            max="100"
                            step="5"
                            value={canaryWeight}
                            onChange={(e) => setCanaryWeight(Number(e.target.value))}
                            className="w-full accent-cud-orange cursor-pointer"
                        />

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                            {[10, 20, 30, 50, 75, 100].map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setCanaryWeight(pct)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${canaryWeight === pct
                                        ? "bg-cud-orange text-slate-950 font-bold"
                                        : "bg-slate-850 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
                                        }`}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};
