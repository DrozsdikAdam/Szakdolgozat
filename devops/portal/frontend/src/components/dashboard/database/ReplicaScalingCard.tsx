import { Cpu, Layers, RefreshCw } from "lucide-react";
import type { ReplicaScalingCardProps } from "../../../types/component/database/replicaScalingCardProps";
import { Card } from "../../common/Card";
import { Slider } from "../../common/Slider";
import { Button } from "../../common/Button";
import { InfoCallout } from "../../common/InfoCallout";

export const ReplicaScalingCard = ({
    replicas,
    poolSize,
    maxReplicas = 5,
    isScaling,
    onReplicasChange,
    onPoolSizeChange,
    onApplyScale,
    disabled = false
}: ReplicaScalingCardProps) => {
    const replicaMarks = Array.from({ length: maxReplicas }, (_, i) => ({
        value: i + 1,
        label: `${i + 1} db`
    }));

    const poolMarks = [
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" }
    ];

    const getHaDescription = (count: number) => {
        if (count === 1) return "Egypéldányos alap fejlesztői vagy teszt felállás (Standalone).";
        if (count === 2) return "Magas rendelkezésre állás (HA) automatikus failoverrel (1 Leader + 1 Standby).";
        if (count === 3) return "Optimális termelési HA klaszter quorum konszenzussal (1 Leader + 2 Standby).";
        return "Nagy teljesítményű olvasási fürt horizontálisan terheléselosztva.";
    };

    return (
        <Card
            title="Magas Rendelkezésre Állás & Skálázás"
            subtitle="Állítsd be a futó adatbázis podok és a kapcsolat-pooling méretét valós időben."
            action={
                <Button
                    variant="primary"
                    size="sm"
                    loading={isScaling}
                    disabled={disabled || isScaling}
                    onClick={onApplyScale}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${isScaling ? 'animate-spin' : ''}`} />}
                >
                    Skálázás Mentése
                </Button>
            }
            className="flex flex-col gap-6"
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-emerald-400" />
                            Adatbázis Példányszám (Pod Replicas)
                        </label>
                        <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {replicas} Pod
                        </span>
                    </div>
                    <Slider
                        value={replicas}
                        min={1}
                        max={maxReplicas}
                        step={1}
                        marks={replicaMarks}
                        onChange={onReplicasChange}
                        accentColor="teal"
                        disabled={disabled || isScaling}
                        ariaLabel="Replikák száma"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        {getHaDescription(replicas)}
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cud-purple" />
                            PgBouncer / Kapcsolat-pool Méret
                        </label>
                        <span className="text-sm font-bold text-cud-purple bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {poolSize} kapcsolat
                        </span>
                    </div>
                    <Slider
                        value={poolSize}
                        min={10}
                        max={100}
                        step={5}
                        marks={poolMarks}
                        onChange={onPoolSizeChange}
                        accentColor="purple"
                        disabled={disabled || isScaling}
                        ariaLabel="Kapcsolat-pool méret"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        A backend mikroszolgáltatások által maximálisan lefoglalható egyidejű multiplexelt kapcsolatok száma.
                    </p>
                </div>

                <InfoCallout
                    variant="info"
                    title="Dinamikus Kubernetes HPA & StatefulSet"
                >
                    A replikaszám módosítása Kubernetes StatefulSet skálázási kérést indít el rolling-update módszerrel, miközben a kapcsolatok folyamatossága biztosított.
                </InfoCallout>
            </div>
        </Card>
    );
};
