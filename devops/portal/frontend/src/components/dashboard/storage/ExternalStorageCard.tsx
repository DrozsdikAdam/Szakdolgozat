import { Cloud, Globe, Folder, Key, Shield, Zap, Save, CheckCircle2, AlertCircle, RefreshCw, Power } from "lucide-react";
import type { ExternalStorageCardProps } from "../../../types/component/storage/externalStorageCardProps";
import { Card } from "../../common/Card";
import { Input } from "../../common/Input";
import { Button } from "../../common/Button";
import { Toggle } from "../../common/Toggle";
import { InfoCallout } from "../../common/InfoCallout";

export const ExternalStorageCard = ({
    formData,
    isDirty,
    isSaving,
    isTesting,
    testResult,
    onFieldChange,
    onSave,
    onTestConnection,
    disabled = false
}: ExternalStorageCardProps) => {
    return (
        <Card
            title="Külső Felhő S3 Konfiguráció (Cloud Storage)"
            subtitle="Csatlakoztasd az alkalmazási réteget közvetlenül AWS S3, Cloudflare R2 vagy Google Cloud Storage vödrökhöz."
            className="flex flex-col gap-6"
        >
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="S3 Végpont URL (Endpoint)"
                            value={formData.externalEndpoint}
                            onChange={(val) => onFieldChange("externalEndpoint", val)}
                            placeholder="https://s3.eu-central-1.amazonaws.com vagy https://<account-id>.r2.cloudflarestorage.com"
                            icon={<Globe className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                    <div>
                        <Input
                            label="Régió (Region)"
                            value={formData.externalRegion}
                            onChange={(val) => onFieldChange("externalRegion", val)}
                            placeholder="eu-central-1 vagy auto"
                            icon={<Cloud className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Input
                            label="S3 Bucket Név"
                            value={formData.externalBucket}
                            onChange={(val) => onFieldChange("externalBucket", val)}
                            placeholder="my-production-bucket"
                            icon={<Folder className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                    <div>
                        <Input
                            label="Access Key ID"
                            value={formData.externalAccessKey}
                            onChange={(val) => onFieldChange("externalAccessKey", val)}
                            placeholder="AKIAIOSFODNN7EXAMPLE"
                            icon={<Key className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                    <div>
                        <Input
                            label="Secret Access Key"
                            type="password"
                            value={formData.externalSecretKey}
                            onChange={(val) => onFieldChange("externalSecretKey", val)}
                            placeholder="••••••••••••••••••••"
                            icon={<Shield className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                            <Power className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-200">
                                Belső MinIO Erőforrás-megtakarítás (Scale-to-Zero)
                            </span>
                            <span className="text-xs text-slate-400">
                                Leállítja a belső MinIO podot (0 replika), felszabadítva a CPU és RAM erőforrásokat a klaszterben.
                            </span>
                        </div>
                    </div>
                    <Toggle
                        checked={formData.scaleDownInternal}
                        onChange={(checked) => onFieldChange("scaleDownInternal", checked)}
                        disabled={disabled || isSaving}
                    />
                </div>

                <InfoCallout
                    variant="info"
                    title="Pre-Flight Hitelesítés & Kapcsolatteszt"
                >
                    A 'Kapcsolat Tesztelése' gomb azonnali HTTP és TCP elérést végez a cél S3 végpont felé a válaszidő (ms) és a DNS feloldás ellenőrzéséhez.
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
                                <span className="font-semibold">{testResult.success ? "Sikeres Csatlakozás" : "Sikertelen Csatlakozás"}</span>
                                {testResult.responseTimeMs > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-slate-300">
                                        {testResult.responseTimeMs} ms
                                    </span>
                                )}
                                {testResult.statusCode && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-slate-300">
                                        HTTP {testResult.statusCode}
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
                        Külső S3 Kapcsolat Tesztelése
                    </Button>

                    <Button
                        variant="primary"
                        size="md"
                        loading={isSaving}
                        disabled={disabled || isSaving || !isDirty}
                        onClick={onSave}
                        icon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    >
                        Felhős Beállítások Mentése
                    </Button>
                </div>
            </div>
        </Card>
    );
};
