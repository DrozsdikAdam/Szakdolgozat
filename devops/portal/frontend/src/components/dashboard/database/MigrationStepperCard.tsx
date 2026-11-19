import { useState, useMemo, useEffect } from "react";
import { ArrowRightLeft, CheckCircle2, Loader2, Calendar, ShieldCheck, Database, AlertTriangle } from "lucide-react";
import type { DatabaseEngine } from "../../../types/database";
import type { MigrationStepperCardProps } from "../../../types/component/database/migrationStepperCardProps";
import { Card } from "../../common/Card";
import { Button } from "../../common/Button";
import { MIGRATION_STEP_LABELS } from "../../../constants/database";

const STEPS = [
    { key: "SNAPSHOT", title: "1. Pillanatkép", desc: "Zárolásmentes konzisztens snapshot" },
    { key: "SCHEMA_INIT", title: "2. DDL Séma", desc: "Táblák, indexek és megszorítások konvertálása" },
    { key: "DATA_COPY", title: "3. Adatmásolás", desc: "Többszálas tömbösített adatátvitel" },
    { key: "VALIDATING", title: "4. Ellenőrzés", desc: "Sorok és checksumok összehasonlítása" },
    { key: "COMPLETED", title: "5. Kész", desc: "Zero-Downtime átállásra kész állapot" }
];

export const MigrationStepperCard = ({
    currentEngine,
    isMigrating,
    activeJob,
    onStartMigration,
    onOpenCutoverModal,
    hasActiveCutoverSchedule = false,
    disabled = false
}: MigrationStepperCardProps) => {
    const availableTargets: DatabaseEngine[] = useMemo(() => {
        return (["postgres", "mssql", "oracle"] as DatabaseEngine[])
            .filter(e => e !== currentEngine);
    }, [currentEngine]);

    const [selectedTarget, setSelectedTarget] = useState<DatabaseEngine>(() => availableTargets[0] || "postgres");

    useEffect(() => {
        setSelectedTarget((prev) => {
            if (availableTargets.includes(prev) && prev !== currentEngine) {
                return prev;
            }
            return availableTargets[0] || (currentEngine === "postgres" ? "mssql" : "postgres");
        });
    }, [currentEngine, availableTargets]);

    const getStepStatus = (stepKey: string) => {
        if (!activeJob) return "inactive";
        if (activeJob.status === "FAILED") return "failed";

        const order = ["PENDING", "SNAPSHOT", "SCHEMA_INIT", "DATA_COPY", "VALIDATING", "COMPLETED"];
        const currentIndex = order.indexOf(activeJob.status);
        const thisIndex = order.indexOf(stepKey);

        if (thisIndex < currentIndex) return "done";
        if (thisIndex === currentIndex) return "active";
        return "inactive";
    };

    const isFinished = activeJob?.status === "COMPLETED";

    return (
        <Card
            title="Zero-Downtime Adatbázis Migrációs Varázsló"
            subtitle="Adatbázis motor váltás és online adatmigráció folyamatos üzem mellett (CDC)."
            className="flex flex-col gap-6"
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-cud-teal-bg border border-cud-teal-border text-cud-teal">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-400">Jelenlegi Forrás Motor</span>
                            <h4 className="text-base font-bold text-slate-100 uppercase">{currentEngine}</h4>
                        </div>
                    </div>

                    <div className="p-2 rounded-full bg-slate-800 text-slate-400">
                        <ArrowRightLeft className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-cud-skyblue-bg border border-cud-skyblue-border text-cud-skyblue">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">Cél Motor Kiválasztása</label>
                            <select
                                value={selectedTarget}
                                onChange={(e) => setSelectedTarget(e.target.value as DatabaseEngine)}
                                disabled={isMigrating || disabled}
                                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cud-skyblue font-semibold uppercase cursor-pointer"
                            >
                                {availableTargets.map(target => (
                                    <option key={target} value={target}>
                                        {target.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {activeJob && (
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-300">Állapot:</span>
                                <span className="text-cud-skyblue font-bold">
                                    {MIGRATION_STEP_LABELS[activeJob.status] || activeJob.status}
                                </span>
                            </div>
                            <span className="font-mono text-cud-teal font-bold">{activeJob.progressPercent}%</span>
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${activeJob.status === "FAILED" ? "bg-rose-500" : "bg-linear-to-r from-cud-teal to-cud-skyblue"
                                    }`}
                                style={{ width: `${activeJob.progressPercent}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-xs">
                            <div>
                                <span className="text-slate-500 block">Migrált táblák:</span>
                                <span className="font-semibold text-slate-200">
                                    {activeJob.tablesMigrated} / {activeJob.tablesTotal} tábla
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Másolt rekordok:</span>
                                <span className="font-semibold text-slate-200">
                                    {activeJob.rowsCopied.toLocaleString()} sor
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Aktuális lépés:</span>
                                <span className="font-semibold text-cud-skyblue truncate block">
                                    {activeJob.currentStep}
                                </span>
                            </div>
                        </div>

                        {activeJob.errorMessage && (
                            <div className="mt-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{activeJob.errorMessage}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {STEPS.map((s) => {
                        const status = getStepStatus(s.key);
                        let borderClass = "border-slate-800 bg-slate-900/40 text-slate-500";
                        if (status === "done") {
                            borderClass = "border-cud-teal-border bg-cud-teal-bg/30 text-cud-teal";
                        } else if (status === "active") {
                            borderClass = "border-cud-skyblue-border bg-cud-skyblue-bg/40 text-slate-100 ring-1 ring-cud-skyblue";
                        } else if (status === "failed") {
                            borderClass = "border-rose-500/40 bg-rose-500/10 text-rose-400";
                        }

                        return (
                            <div key={s.key} className={`p-3 rounded-lg border flex flex-col gap-1 transition-all ${borderClass}`}>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold truncate">{s.title}</span>
                                    {status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-cud-teal shrink-0" />}
                                    {status === "active" && <Loader2 className="w-3.5 h-3.5 text-cud-skyblue animate-spin shrink-0" />}
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                                    {s.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cud-teal" />
                        <span>Kettős írás (Dual-Write) és valós idejű konzisztencia biztosított.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {isFinished ? (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={onOpenCutoverModal}
                                disabled={disabled}
                                icon={<Calendar className="w-4 h-4" />}
                            >
                                {hasActiveCutoverSchedule ? "Átállási Ablak Megtekintése" : "Átállási Ablak Ütemezése (Cutover)"}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="md"
                                loading={isMigrating}
                                disabled={disabled || isMigrating}
                                onClick={() => onStartMigration(selectedTarget)}
                                icon={<ArrowRightLeft className="w-4 h-4" />}
                            >
                                {isMigrating ? "Migráció folyamatban..." : "Online Migráció Indítása"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
