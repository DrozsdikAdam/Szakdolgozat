import { useState, useEffect } from "react";
import { HardDrive, Cloud, Globe, Folder, Key, Shield, Zap, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "../../common/Card";
import { Input } from "../../common/Input";
import { Button } from "../../common/Button";
import { BackupApi } from "../../../client/api/backup";
import type { BackupStorageMode, BackupTargetDto, BackupTargetTestResultDto } from "../../../types/backup";

interface BackupTargetCardProps {
    onTargetChanged?: () => void;
}

export const BackupTargetCard = ({ onTargetChanged }: BackupTargetCardProps) => {
    const [mode, setMode] = useState<BackupStorageMode>("internal");
    const [endpoint, setEndpoint] = useState<string>("");
    const [bucket, setBucket] = useState<string>("mes-backups");
    const [region, setRegion] = useState<string>("us-east-1");
    const [accessKey, setAccessKey] = useState<string>("");
    const [secretKey, setSecretKey] = useState<string>("");

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<BackupTargetTestResultDto | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [isDirty, setIsDirty] = useState<boolean>(false);

    const api = new BackupApi();

    const loadTarget = async () => {
        try {
            const data: BackupTargetDto = await api.getTarget();
            if (data) {
                setMode(data.mode);
                setEndpoint(data.endpoint || "");
                setBucket(data.bucket || "mes-backups");
                setRegion(data.region || "us-east-1");
                setAccessKey(data.accessKeyMasked || "");
                setIsDirty(false);
            }
        } catch {
            // Hiba esetén maradnak az alapértékek
        }
    };

    useEffect(() => {
        loadTarget();
    }, []);

    const handleModeSwitch = (newMode: BackupStorageMode) => {
        setMode(newMode);
        setIsDirty(true);
        setTestResult(null);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await api.testTarget({
                mode,
                endpoint,
                bucket,
                region,
                accessKey,
                secretKey
            });
            setTestResult(res);
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.message || "Nem sikerült a kapcsolat tesztelése."
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setStatusMessage(null);
        try {
            await api.saveTarget({
                mode,
                endpoint,
                bucket,
                region,
                accessKey,
                secretKey
            });
            setStatusMessage({
                text: mode === "internal"
                    ? "Belső MinIO mentési célpont sikeresen alkalmazva!"
                    : "Külső S3 felhős mentési célpont sikeresen elmentve és érvényesítve!",
                type: "success"
            });
            setIsDirty(false);
            setSecretKey("");
            if (onTargetChanged) onTargetChanged();
            setTimeout(() => setStatusMessage(null), 5000);
        } catch (err: any) {
            setStatusMessage({
                text: `Hiba a mentési célpont mentésekor: ${err.message || err}`,
                type: "error"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card
            title="Biztonsági Mentés Tárolási Célpont (Backup Target)"
            subtitle="Itt állíthatod be, hogy az adatbázis-mentések (Postgres, MSSQL, Oracle) a platform belső MinIO tárolójába vagy külső felhős S3 tárolóba (AWS S3, Cloudflare R2, GCP) kerüljenek."
            className="flex flex-col gap-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => handleModeSwitch("internal")}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${mode === "internal"
                            ? "bg-cud-teal/10 border-cud-teal shadow-lg shadow-cud-teal/10 text-white"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                >
                    <div className={`p-2.5 rounded-lg shrink-0 ${mode === "internal" ? "bg-cud-teal/20 text-cud-teal" : "bg-slate-800 text-slate-400"}`}>
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm flex items-center gap-2 text-slate-200">
                            Belső Platform MinIO
                            {mode === "internal" && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Aktív
                                </span>
                            )}
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            A Kubernetes fürtön belüli nagy sebességű MinIO tárolót használja (<code className="text-slate-300">http://minio:9000/mes-backups</code>).
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => handleModeSwitch("external")}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${mode === "external"
                            ? "bg-cud-teal/10 border-cud-teal shadow-lg shadow-cud-teal/10 text-white"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                >
                    <div className={`p-2.5 rounded-lg shrink-0 ${mode === "external" ? "bg-cud-teal/20 text-cud-teal" : "bg-slate-800 text-slate-400"}`}>
                        <Cloud className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm flex items-center gap-2 text-slate-200">
                            Külső Felhő S3 Tárhely
                            {mode === "external" && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Aktív
                                </span>
                            )}
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Közvetlenül külső AWS S3, Cloudflare R2, Google Cloud Storage vagy Wasabi vödrökbe küldi a mentéseket.
                        </p>
                    </div>
                </button>
            </div>

            {mode === "internal" && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <div>
                            <span className="text-xs font-semibold text-slate-300">Belső célpont címe:</span>
                            <div className="text-sm font-mono text-slate-200">http://minio.platform-infra.svc.cluster.local:9000</div>
                            <span className="text-xs text-slate-400">Cél bucket: <strong className="text-slate-300">mes-backups</strong> (Automatikusan inicializálva)</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            onClick={handleTest}
                            loading={isTesting}
                            icon={<Zap className="w-4 h-4 text-amber-400" />}
                        >
                            Kapcsolatteszt
                        </Button>
                        {isDirty && (
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                loading={isSaving}
                                icon={<Save className="w-4 h-4" />}
                            >
                                Alkalmazás
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {mode === "external" && (
                <div className="flex flex-col gap-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="S3 Végpont URL (Endpoint)"
                                value={endpoint}
                                onChange={(val) => { setEndpoint(val); setIsDirty(true); }}
                                placeholder="https://s3.eu-central-1.amazonaws.com vagy https://<account-id>.r2.cloudflarestorage.com"
                                icon={<Globe className="w-4 h-4 text-slate-400" />}
                                accentColor="teal"
                                disabled={isSaving}
                            />
                        </div>
                        <div>
                            <Input
                                label="Régió (Region)"
                                value={region}
                                onChange={(val) => { setRegion(val); setIsDirty(true); }}
                                placeholder="eu-central-1 vagy us-east-1"
                                icon={<Cloud className="w-4 h-4 text-slate-400" />}
                                accentColor="teal"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Input
                                label="S3 Bucket Név"
                                value={bucket}
                                onChange={(val) => { setBucket(val); setIsDirty(true); }}
                                placeholder="mes-backups-prod"
                                icon={<Folder className="w-4 h-4 text-slate-400" />}
                                accentColor="teal"
                                disabled={isSaving}
                            />
                        </div>
                        <div>
                            <Input
                                label="Access Key ID"
                                value={accessKey}
                                onChange={(val) => { setAccessKey(val); setIsDirty(true); }}
                                placeholder="AKIAIOSFODNN7EXAMPLE"
                                icon={<Key className="w-4 h-4 text-slate-400" />}
                                accentColor="teal"
                                disabled={isSaving}
                            />
                        </div>
                        <div>
                            <Input
                                label="Secret Access Key"
                                type="password"
                                value={secretKey}
                                onChange={(val) => { setSecretKey(val); setIsDirty(true); }}
                                placeholder="••••••••••••••••••••••••"
                                icon={<Shield className="w-4 h-4 text-slate-400" />}
                                accentColor="teal"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            variant="secondary"
                            onClick={handleTest}
                            loading={isTesting}
                            icon={<Zap className="w-4 h-4 text-amber-400" />}
                        >
                            Kapcsolatteszt
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            loading={isSaving}
                            disabled={!isDirty && !secretKey}
                            icon={<Save className="w-4 h-4" />}
                        >
                            Mentési Célpont Mentése
                        </Button>
                    </div>
                </div>
            )}

            {testResult && (
                <div className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${testResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    }`}>
                    <div className="flex items-center gap-2.5">
                        {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span className="font-medium">{testResult.message}</span>
                    </div>
                    {testResult.latencyMs !== undefined && (
                        <span className="font-mono opacity-80">{testResult.latencyMs} ms</span>
                    )}
                </div>
            )}

            {statusMessage && (
                <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in duration-200 ${statusMessage.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    }`}>
                    {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span className="font-medium">{statusMessage.text}</span>
                </div>
            )}
        </Card>
    );
};
