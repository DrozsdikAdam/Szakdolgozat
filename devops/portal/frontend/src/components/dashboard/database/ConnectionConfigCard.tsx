import { Server, Hash, Database, User, Key, Zap, Save, CheckCircle2, AlertCircle } from "lucide-react";
import type { ConnectionConfigCardProps } from "../../../types/component/database/connectionConfigCardProps";
import { Card } from "../../common/Card";
import { Input } from "../../common/Input";
import { Button } from "../../common/Button";

export const ConnectionConfigCard = ({
    formData,
    isDirty,
    isPinging,
    isSaving,
    pingResult,
    onFieldChange,
    onTestConnection,
    onSaveConfig,
    disabled = false
}: ConnectionConfigCardProps) => {
    return (
        <Card
            title="Kapcsolati Paraméterek & Hitelesítés"
            subtitle="Állítsd be az adatbázis hosztját, hitelesítő adatait és a környezeti változókat."
            className="flex flex-col gap-6"
        >
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Kiszolgáló Hoszt / K8s FQDN"
                            value={formData.host}
                            onChange={(val) => onFieldChange("host", val)}
                            placeholder="postgres-master.storage.svc.cluster.local"
                            icon={<Server className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                    <div>
                        <Input
                            label="Port"
                            type="number"
                            value={formData.port}
                            onChange={(val) => onFieldChange("port", Number(val))}
                            placeholder="5432"
                            icon={<Hash className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Input
                            label="Adatbázis Név"
                            value={formData.database}
                            onChange={(val) => onFieldChange("database", val)}
                            placeholder="mesdb"
                            icon={<Database className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                    <div>
                        <Input
                            label="Felhasználónév"
                            value={formData.username}
                            onChange={(val) => onFieldChange("username", val)}
                            placeholder="mesuser"
                            icon={<User className="w-4 h-4 text-slate-400" />}
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                    <div>
                        <Input
                            label="Jelszó"
                            type="password"
                            value={formData.password || ""}
                            onChange={(val) => onFieldChange("password", val)}
                            placeholder="••••••••••••"
                            icon={<Key className="w-4 h-4 text-slate-400" />}
                            helperText="Üresen hagyva a meglévő K8s titkosítás marad érvényben"
                            accentColor="teal"
                            disabled={disabled || isSaving}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                    <input
                        type="checkbox"
                        id="restartWorkload"
                        checked={formData.restartWorkload}
                        onChange={(e) => onFieldChange("restartWorkload", e.target.checked)}
                        disabled={disabled || isSaving}
                        className="w-4 h-4 text-cud-teal rounded bg-slate-900 border-slate-700 focus:ring-cud-teal cursor-pointer"
                    />
                    <label htmlFor="restartWorkload" className="text-xs text-slate-300 cursor-pointer select-none">
                        Backend szolgáltatások automatikus újraindítása (Rolling Restart) a mentést követően az új kapcsolati adatok azonnali átvételéhez.
                    </label>
                </div>

                {pingResult && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${pingResult.success
                            ? "bg-cud-teal-bg/60 border-cud-teal-border text-slate-100"
                            : "bg-cud-vermillon-bg/60 border-cud-vermillon-border text-slate-100"
                        }`}>
                        {pingResult.success ? (
                            <CheckCircle2 className="w-5 h-5 text-cud-teal shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-semibold text-sm">
                                {pingResult.success ? "Kapcsolat sikeresen felépült" : "Kapcsolódási hiba történt"}
                            </span>
                            <span className="text-slate-300">{pingResult.message}</span>
                            {pingResult.latencyMs > 0 && (
                                <span className="font-mono text-slate-400 mt-1">
                                    Válaszidő: <span className="text-cud-teal font-semibold">{pingResult.latencyMs} ms</span>
                                    {pingResult.serverVersion ? ` • Verzió: ${pingResult.serverVersion}` : ""}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <Button
                        variant="secondary"
                        size="md"
                        loading={isPinging}
                        disabled={disabled || isPinging || isSaving}
                        onClick={onTestConnection}
                        icon={<Zap className={`w-4 h-4 ${isPinging ? 'text-amber-400' : 'text-slate-400'}`} />}
                    >
                        {isPinging ? "Tesztelés folyamatban..." : "Kapcsolat Tesztelése (Ping)"}
                    </Button>

                    <Button
                        variant="primary"
                        size="md"
                        loading={isSaving}
                        disabled={disabled || isSaving || !isDirty}
                        onClick={onSaveConfig}
                        icon={<Save className="w-4 h-4" />}
                    >
                        {isSaving ? "Mentés folyamatban..." : "Konfiguráció Mentése"}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
