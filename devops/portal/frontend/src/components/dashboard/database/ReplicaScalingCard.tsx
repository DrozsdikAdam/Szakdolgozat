import { Cpu, Layers, RefreshCw, Network } from "lucide-react";
import type { ReplicaScalingCardProps } from "../../../types/component/database/replicaScalingCardProps";
import { Card } from "../../common/Card";
import { Slider } from "../../common/Slider";
import { Button } from "../../common/Button";
import { Toggle } from "../../common/Toggle";
import { InfoCallout } from "../../common/InfoCallout";
import {
    DATABASE_POOL_LIMITS,
    DATABASE_REPLICA_LIMITS,
    DEFAULT_POOL_MARKS,
    getReplicaMarks,
    HA_REPLICA_DESCRIPTIONS,
    DEFAULT_HA_REPLICA_DESCRIPTION
} from "../../../constants/database";

export const ReplicaScalingCard = ({
    replicas,
    poolSize,
    maxReplicas = DATABASE_REPLICA_LIMITS.MAX_REPLICAS,
    isScaling,
    onReplicasChange,
    onPoolSizeChange,
    onApplyScale,
    disabled = false,
    engine = "postgres",
    pgbouncerEnabled = true,
    onTogglePgbouncer,
    haproxyEnabled = false,
    onToggleHaproxy,
    isProxyToggling = false
}: ReplicaScalingCardProps) => {
    const isPostgres = engine === "postgres";
    const replicaMarks = getReplicaMarks(maxReplicas);

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
                        min={DATABASE_REPLICA_LIMITS.MIN_REPLICAS}
                        max={maxReplicas}
                        step={DATABASE_REPLICA_LIMITS.STEP}
                        marks={replicaMarks}
                        onChange={onReplicasChange}
                        accentColor="teal"
                        disabled={disabled || isScaling}
                        ariaLabel="Replikák száma"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        {HA_REPLICA_DESCRIPTIONS[replicas] || DEFAULT_HA_REPLICA_DESCRIPTION}
                    </p>
                </div>

                {isPostgres && (
                    <div className="flex flex-col gap-3 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-lg border ${pgbouncerEnabled ? 'bg-cud-teal/10 border-cud-teal/30 text-cud-teal' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                                        PgBouncer & PgPool Connection Pooling
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${pgbouncerEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                            {pgbouncerEnabled ? "Aktív (1 Pod)" : "Leállítva (0 Pod)"}
                                        </span>
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        Tranzakciós kapcsolatgyűjtő az adatbázis tehermentesítésére.
                                    </p>
                                </div>
                            </div>

                            {onTogglePgbouncer && (
                                <Toggle
                                    checked={pgbouncerEnabled}
                                    loading={isProxyToggling}
                                    onChange={onTogglePgbouncer}
                                    ariaLabel="PgBouncer Ki/Be kapcsolása"
                                />
                            )}
                        </div>

                        {pgbouncerEnabled && (
                            <>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-cud-purple" />
                                        Kapcsolat-pool Méret
                                    </label>
                                    <span className="text-sm font-bold text-cud-purple bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                        {poolSize} kapcsolat
                                    </span>
                                </div>
                                <Slider
                                    value={poolSize}
                                    min={DATABASE_POOL_LIMITS.MIN_SIZE}
                                    max={DATABASE_POOL_LIMITS.MAX_SIZE}
                                    step={DATABASE_POOL_LIMITS.STEP}
                                    marks={DEFAULT_POOL_MARKS}
                                    onChange={onPoolSizeChange}
                                    accentColor="purple"
                                    disabled={disabled || isScaling}
                                    ariaLabel="Kapcsolat-pool méret"
                                />
                                <p className="text-xs text-slate-400 mt-0.5">
                                    A backend mikroszolgáltatások által maximálisan lefoglalható egyidejű multiplexelt kapcsolatok száma.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {!isPostgres && (
                    <div className="flex flex-col gap-3 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-lg border ${haproxyEnabled ? 'bg-cud-skyblue/10 border-cud-skyblue/30 text-cud-skyblue' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    <Network className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                                        HAProxy Terheléselosztó & TCP Routing
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${haproxyEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                            {haproxyEnabled ? "Aktív (1 Pod)" : "Leállítva (0 Pod)"}
                                        </span>
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        {engine.toUpperCase()} port routing (1433/1521) és forgalomelérés a klaszter replikái felé.
                                    </p>
                                </div>
                            </div>

                            {onToggleHaproxy && (
                                <Toggle
                                    checked={haproxyEnabled}
                                    loading={isProxyToggling}
                                    onChange={onToggleHaproxy}
                                    ariaLabel="HAProxy Ki/Be kapcsolása"
                                />
                            )}
                        </div>
                    </div>
                )}

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
