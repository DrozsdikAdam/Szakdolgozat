import { Layers, Server, Folder, Zap, Save, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import type { InternalStorageCardProps } from "../../../types/component/storage/internalStorageCardProps";
import { Card } from "../../common/Card";
import { Slider } from "../../common/Slider";
import { Button } from "../../common/Button";
import { InfoCallout } from "../../common/InfoCallout";
import { STORAGE_LIMITS, STORAGE_SIZE_MARKS } from "../../../constants/storage";

export const InternalStorageCard = ({
    overview,
    internalSizeGb,
    isDirty,
    isSaving,
    isTesting,
    testResult,
    onSizeChange,
    onSave,
    onTestConnection,
    disabled = false
}: InternalStorageCardProps) => {
    const currentAllocated = overview?.internal.allocatedSizeGb ?? 5;

    return (
        <Card
            title="Belső MinIO Tároló és Kapacitás Méretezés"
            subtitle="Állítsd be a Kubernetes Persistent Volume Claim (PVC) kötet méretét valós időben 1 és 10 GB között."
            className="flex flex-col gap-6"
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cud-teal" />
                            Kötet Kapacitás (PVC Méret)
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                                Jelenlegi: {currentAllocated} GB
                            </span>
                            <span className="text-sm font-bold text-cud-teal bg-cud-teal/10 px-2.5 py-0.5 rounded border border-cud-teal/20">
                                {internalSizeGb} GB
                            </span>
                        </div>
                    </div>

                    <Slider
                        value={internalSizeGb}
                        min={STORAGE_LIMITS.MIN_SIZE_GB}
                        max={STORAGE_LIMITS.MAX_SIZE_GB}
                        step={1}
                        marks={STORAGE_SIZE_MARKS}
                        onChange={onSizeChange}
                        accentColor="teal"
                        disabled={disabled || isSaving}
                        ariaLabel="Belső tárhely mérete"
                    />

                    <p className="text-xs text-slate-400 mt-1">
                        A Kubernetes CSI driver támogatja a tárolóméret növelését (maximum 10 GB-ig) újraindítás nélkül.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-slate-400" />
                            Klaszter Belső S3 Végpont
                        </span>
                        <code className="text-xs font-mono text-cud-teal break-all select-all">
                            {overview?.internal.endpoint || "http://app-storage.platform-infra.svc.cluster.local:9000"}
                        </code>
                    </div>

                    <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-slate-400" />
                            Kezdő Objektumtár Vödör (Bucket)
                        </span>
                        <code className="text-xs font-mono text-indigo-400 break-all select-all">
                            {overview?.internal.bucketName || "mes-app-storage"}
                        </code>
                    </div>
                </div>

                <InfoCallout
                    variant="teal"
                    title="Kubernetes Kötet Kezelés"
                >
                    A PersistentVolumeClaim (PVC) online kiterjeszthető 10 GB-ig. Adatbiztonsági okokból a Kubernetes nem engedélyezi a lefoglalt kötetek zsugorítását az adatvesztés elkerülése végett.
                </InfoCallout>

                {testResult && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${testResult.success
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}>
                        {testResult.success ? (
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                        )}
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{testResult.success ? "Kapcsolat Sikeres" : "Kapcsolódási Hiba"}</span>
                                {testResult.responseTimeMs > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-slate-300">
                                        {testResult.responseTimeMs} ms
                                    </span>
                                )}
                            </div>
                            <p className="text-xs opacity-90">{testResult.message}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button
                        variant="secondary"
                        size="md"
                        loading={isTesting}
                        disabled={disabled || isTesting}
                        onClick={onTestConnection}
                        icon={<Zap className="w-4 h-4 text-amber-400" />}
                    >
                        MinIO Elérhetőség Tesztelése
                    </Button>

                    <Button
                        variant="primary"
                        size="md"
                        loading={isSaving}
                        disabled={disabled || isSaving || !isDirty}
                        onClick={onSave}
                        icon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    >
                        Beállítások Mentése
                    </Button>
                </div>
            </div>
        </Card>
    );
};
