import { Database, DatabaseX, Server, ShieldCheck, Terminal } from "lucide-react"
import type { DatabaseEngine, SetupStepComponentProps } from "../../../types/component/setup/setupDataProps"
import { InfoCallout } from "../../common/InfoCallout"
import { Button } from "../../common/Button"
import { PresetGroup } from "../../common/PresetGroup"
import { Input } from "../../common/Input"

import { DB_ENGINE_OPTIONS, DB_MODE_OPTIONS } from "../../../constants/database"

export const DatabaseStep = ({ data, onChange, disabled }: SetupStepComponentProps) => {
    const currentEngine: DatabaseEngine = data.dbEngine || "postgres"

    const externalConfigDetails = {
        postgres: {
            label: "PostgreSQL Kapcsolati Sztring (Connection URI)",
            placeholder: "postgresql://app_user:titkos_jelszo@db.ceg.hu:5432/app_production",
            helperText: "Szabványos URI formátum: postgresql://[user]:[password]@[host]:5432/[database]",
        },
        mssql: {
            label: "MS SQL Server Kapcsolati Sztring (Connection String)",
            placeholder: "Server=db.ceg.hu,1433;Database=mesdb;User Id=sa;Password=titkos_jelszo;TrustServerCertificate=true;",
            helperText: "Formátum: Server=[host],[port];Database=[db];User Id=[user];Password=[password];TrustServerCertificate=true;",
        },
        oracle: {
            label: "Oracle Database Kapcsolati Sztring (URI / EasyConnect)",
            placeholder: "oracle://mesuser:titkos_jelszo@db.ceg.hu:1521/mesdb",
            helperText: "Szabványos formátum: oracle://[user]:[password]@[host]:1521/[service_name]",
        },
    }[currentEngine]

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Database className="w-5 h-5 text-cud-teal" />
                        Adatbázis & Perzisztens Adattárház
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Relációs adatbázis réteg beállítása: belső felügyelt Kubernetes klaszter vagy külső felhős kapcsolat.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant={data.dbEnabled ? "primary" : "secondary"}
                        size="md"
                        onClick={() => onChange("dbEnabled", true)}
                        disabled={disabled}
                    >
                        Bekapcsolva
                    </Button>
                    <Button
                        variant={!data.dbEnabled ? "danger" : "secondary"}
                        size="md"
                        onClick={() => onChange("dbEnabled", false)}
                        disabled={disabled}
                    >
                        Kikapcsolva
                    </Button>
                </div>
            </div>

            {data.dbEnabled && (
                <div className="flex flex-col gap-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner">
                    <PresetGroup
                        title="Adatbázis Motor (RDBMS Engine)"
                        subtitle="Válaszd ki a használni kívánt relációs adatbázis típust"
                        options={DB_ENGINE_OPTIONS}
                        selectedId={currentEngine}
                        onSelect={(option) => onChange("dbEngine", option.value)}
                        columns={3}
                        accentColor="teal"
                        disabled={disabled}
                    />

                    <div className="pt-2 border-t border-slate-800/60">
                        <PresetGroup
                            title="Üzemeltetési Mód"
                            subtitle="Fürtön belüli konténerként vagy külső felhős szerverként fusson"
                            options={DB_MODE_OPTIONS}
                            selectedId={data.dbMode}
                            onSelect={(option) => onChange("dbMode", option.value)}
                            columns={2}
                            accentColor="skyblue"
                            disabled={disabled}
                        />
                    </div>

                    {data.dbMode === "internal" && (
                        <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Server className="w-3.5 h-3.5 text-cud-teal" />
                                    Belső Kubernetes Végpontok & Konfiguráció
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-cud-teal/15 text-cud-teal border border-cud-teal/30 font-medium">
                                    Automatikus K8s Provisioning
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {currentEngine === "postgres" && (
                                    <>
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400">Elsődleges Írási Cím (Master):</span>
                                            <code className="text-xs font-mono text-cud-teal break-all">
                                                postgres-master.storage.svc.cluster.local:5432
                                            </code>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400">Olvasási Cím (Replica HA):</span>
                                            <code className="text-xs font-mono text-cud-skyblue break-all">
                                                postgres-replica.storage.svc.cluster.local:5432
                                            </code>
                                        </div>
                                    </>
                                )}

                                {currentEngine === "mssql" && (
                                    <>
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400">MS SQL K8s Service Cím:</span>
                                            <code className="text-xs font-mono text-cud-teal break-all">
                                                mssql.platform-infra.svc.cluster.local:1433
                                            </code>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400">Adatbázis & Rendszergazda:</span>
                                            <span className="text-xs font-mono text-slate-300">
                                                DB: <strong className="text-cud-skyblue">mesdb</strong> | Felhasználó: <strong className="text-cud-skyblue">sa</strong>
                                            </span>
                                        </div>
                                    </>
                                )}

                                {currentEngine === "oracle" && (
                                    <>
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400">Oracle K8s Service Cím:</span>
                                            <code className="text-xs font-mono text-cud-teal break-all">
                                                oracle.platform-infra.svc.cluster.local:1521
                                            </code>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400">Adatbázis (PDB) & Felhasználó:</span>
                                            <span className="text-xs font-mono text-slate-300">
                                                PDB: <strong className="text-cud-skyblue">mesdb</strong> | Felhasználó: <strong className="text-cud-skyblue">mesuser</strong>
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 mt-1">
                                <ShieldCheck className="w-4 h-4 text-cud-teal shrink-0" />
                                <span>
                                    A Kubernetes automatikusan létrehozza a perzisztens tárolókat (PVC) és a hitelesítési Secret objektumokat a <code className="text-slate-300 font-mono">devops/k8s/databases/{currentEngine}</code> manifeszt alapján.
                                </span>
                            </div>
                        </div>
                    )}

                    {data.dbMode === "external" && (
                        <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-4">
                            <Input
                                label={externalConfigDetails.label}
                                icon={<Terminal />}
                                value={data.dbConnectionString ?? ""}
                                type="password"
                                disabled={disabled}
                                onChange={(val) => onChange("dbConnectionString", val)}
                                placeholder={externalConfigDetails.placeholder}
                                helperText={externalConfigDetails.helperText}
                                accentColor="skyblue"
                            />
                        </div>
                    )}
                </div>
            )}

            {!data.dbEnabled && (
                <div className="w-full">
                    <InfoCallout
                        title="Az adatbázis-szolgáltatás inaktív"
                        icon={<DatabaseX className="w-5 h-5 text-cud-teal" />}
                    >
                        <p>
                            A rendszer perzisztens relációs adatbázis nélkül indul el állapotmentes üzemmódban.
                            Ha az alkalmazásodnak mégis szüksége lenne relációs adattárra, a kiválasztott motort (PostgreSQL, MS SQL, Oracle) a platform inicializálása után a Vezérlőpultban bármikor aktiválhatod.
                        </p>
                    </InfoCallout>
                </div>
            )}
        </div>
    )
}