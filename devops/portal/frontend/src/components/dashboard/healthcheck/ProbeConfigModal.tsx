import { useState, useEffect } from "react";
import { Zap, HeartPulse, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import type { ProbeConfigModalProps } from "../../../types/component/healthcheck/probeConfigModalProps";
import type { HealthCheckType, ProbeDefinition, ProbeType, UpdateProbeDto } from "../../../types/healthcheck";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";
import { Toggle } from "../../common/Toggle";
import { Input } from "../../common/Input";
import { Select } from "../../common/Select";
import { SegmentedControl } from "../../common/SegmentedControl";

const getInitialProbe = (kind: HealthCheckType, existing?: ProbeDefinition): ProbeDefinition => ({
    enabled: Boolean(existing?.enabled),
    type: existing?.type || "httpGet",
    httpPath: existing?.httpPath || (kind === "readiness" ? "/actuator/health/readiness" : "/actuator/health/liveness"),
    port: existing?.port || 8080,
    command: existing?.command || [],
    initialDelaySeconds: existing?.initialDelaySeconds ?? (kind === "startup" ? 15 : 10),
    periodSeconds: existing?.periodSeconds ?? 10,
    timeoutSeconds: existing?.timeoutSeconds ?? 2,
    failureThreshold: existing?.failureThreshold ?? 3,
    successThreshold: existing?.successThreshold ?? 1
});


export const ProbeConfigModal = ({ isOpen, onClose, workload, onSave, isSaving = false }: ProbeConfigModalProps) => {
    const [activeKind, setActiveKind] = useState<HealthCheckType>("liveness");

    const [drafts, setDrafts] = useState<Record<HealthCheckType, ProbeDefinition>>(() => ({
        startup: getInitialProbe("startup", workload?.startupProbe),
        liveness: getInitialProbe("liveness", workload?.livenessProbe),
        readiness: getInitialProbe("readiness", workload?.readinessProbe),
    }));

    const currentProbe = drafts[activeKind];
    const updateCurrentProbe = (patch: Partial<ProbeDefinition>) => {
        setDrafts(prev => ({
            ...prev,
            [activeKind]: {
                ...prev[activeKind],
                ...patch
            }
        }));
    };

    useEffect(() => {
        if (!isOpen || !workload) return;
        setDrafts({
            startup: getInitialProbe("startup", workload.startupProbe),
            liveness: getInitialProbe("liveness", workload.livenessProbe),
            readiness: getInitialProbe("readiness", workload.readinessProbe),
        });
    }, [isOpen, workload]);


    if (!workload) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const probeDef: ProbeDefinition = {
            enabled: currentProbe.enabled,
            type: currentProbe.type,
            httpPath: currentProbe.type === "httpGet" ? (currentProbe.httpPath?.trim() || "/healthz") : undefined,
            port: (currentProbe.type === "httpGet" || currentProbe.type === "tcpSocket") ? (Number(currentProbe.port) || currentProbe.port || 8080) : undefined,
            command: currentProbe.type === "exec" && currentProbe.command?.join(" ").trim() ? currentProbe.command.join(" ").trim().split(" ") : undefined,
            initialDelaySeconds: Number(currentProbe.initialDelaySeconds) || 5,
            periodSeconds: Number(currentProbe.periodSeconds) || 10,
            timeoutSeconds: Number(currentProbe.timeoutSeconds) || 2,
            failureThreshold: Number(currentProbe.failureThreshold) || 3,
            successThreshold: Number(currentProbe.successThreshold) || 1
        };

        const updateDto: UpdateProbeDto = {
            deploymentName: workload.name,
            namespace: workload.namespace,
            containerName: workload.containerName,
            probeKind: activeKind,
            probe: probeDef
        };

        await onSave(updateDto);
    };

    const probeKindOptions = [
        { id: "startup", label: "Startup Szonda", icon: <Zap className="w-3.5 h-3.5" />, variant: "orange" as const },
        { id: "liveness", label: "Liveness Szonda", icon: <HeartPulse className="w-3.5 h-3.5" />, variant: "vermillon" as const },
        { id: "readiness", label: "Readiness Szonda", icon: <CheckCircle2 className="w-3.5 h-3.5" />, variant: "teal" as const }
    ];

    const probeTypeOptions = [
        { value: "httpGet", label: "HTTP GET Kérés" },
        { value: "tcpSocket", label: "TCP Socket Kapcsolat" },
        { value: "exec", label: "Konténer Parancs (Exec)" }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Szondák Testreszabása — ${workload.name}`}
            subtitle={`${workload.namespace} névtér · konténer: ${workload.containerName || workload.name}`}
            icon={<ShieldCheck className="w-5 h-5 text-cud-teal" />}
            maxWidth="2xl"
            footer={
                <div className="flex items-center justify-between w-full p-2">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-cud-skyblue animate-spin-slow shrink-0" />
                        <span>A mentés automatikus gördülő újraindítást indít.</span>
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
                            Szonda Mentése & Alkalmazás
                        </Button>
                    </div>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5 p-1">
                <div className="flex justify-center pb-2">
                    <SegmentedControl
                        value={activeKind}
                        onChange={(val) => setActiveKind(val as HealthCheckType)}
                        options={probeKindOptions}
                        size="sm"
                    />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div>
                        <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                            <span>{activeKind.toUpperCase()} szonda státusza</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${currentProbe.enabled ? 'bg-cud-teal/15 text-cud-teal border border-cud-teal/30' : 'bg-slate-800 text-slate-400'
                                }`}>
                                {currentProbe.enabled ? "Aktív" : "Kikapcsolva"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {activeKind === "startup" && "Lassú indulású alkalmazások védelme, amíg a szonda sikeres választ nem ad."}
                            {activeKind === "liveness" && "Fagyott konténerek automatikus újraindítása hiba esetén."}
                            {activeKind === "readiness" && "Forgalom levétele a podról, ha átmenetileg nem áll készen a kérésekre."}
                        </p>
                    </div>
                    <Toggle
                        checked={currentProbe.enabled}
                        onChange={(enabled) => updateCurrentProbe({ enabled })}
                        disabled={isSaving}
                    />
                </div>

                {currentProbe.enabled ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Szonda Típusa
                                </label>
                                <Select
                                    value={currentProbe.type}
                                    onChange={(val) => updateCurrentProbe({ type: val as ProbeType })}
                                    options={probeTypeOptions}
                                    size="md"
                                    className="w-full"
                                    disabled={isSaving}
                                />
                            </div>

                            {(currentProbe.type === "httpGet" || currentProbe.type === "tcpSocket") && (
                                <Input
                                    label="Port (Szám vagy Elnevezés)"
                                    value={currentProbe.port}
                                    onChange={(port) => updateCurrentProbe({ port })}
                                    placeholder="pl. 8080 vagy http"
                                    disabled={isSaving}
                                />
                            )}
                        </div>

                        {currentProbe.type === "httpGet" && (
                            <Input
                                label="HTTP Elérési Út (Endpoint)"
                                value={currentProbe.httpPath}
                                onChange={(httpPath) => updateCurrentProbe({ httpPath })}
                                placeholder="pl. /actuator/health/liveness"
                                disabled={isSaving}
                            />

                        )}

                        {currentProbe.type === "exec" && (
                            <Input
                                label="Futtatandó Parancs (szóközzel elválasztva)"
                                value={currentProbe.command?.join(" ") || ""}
                                onChange={(cmd) => updateCurrentProbe({ command: cmd ? cmd.split(" ") : [] })}
                                placeholder="pl. cat /tmp/healthy vagy curl -f http://localhost:8080/health"
                                disabled={isSaving}
                            />
                        )}

                        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                Időzítési & Küszöb Paraméterek
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <Input
                                    type="number"
                                    label="Kezdeti késleltetés (s)"
                                    accentColor="teal"
                                    value={currentProbe.initialDelaySeconds}
                                    onChange={(val) => updateCurrentProbe({ initialDelaySeconds: Number(val) })}
                                    disabled={isSaving}
                                    min={0}
                                    max={300}
                                    placeholder="Kezdeti késleltetés (s)"
                                />

                                <Input
                                    type="number"
                                    label="Gyakoriság (s)"
                                    accentColor="teal"
                                    value={currentProbe.periodSeconds}
                                    onChange={(val) => updateCurrentProbe({ periodSeconds: Number(val) })}
                                    disabled={isSaving}
                                    min={1}
                                    max={120}
                                    placeholder="Gyakoriság (s)"
                                />

                                <Input
                                    type="number"
                                    label="Időtúllépés (s)"
                                    accentColor="teal"
                                    value={currentProbe.timeoutSeconds}
                                    onChange={(val) => updateCurrentProbe({ timeoutSeconds: Number(val) })}
                                    disabled={isSaving}
                                    min={1}
                                    max={30}
                                    placeholder="Időtúllépés (s)"
                                />

                                <Input
                                    type="number"
                                    label="Hibatűrés (küszöb)"
                                    accentColor="teal"
                                    value={currentProbe.failureThreshold}
                                    onChange={(val) => updateCurrentProbe({ failureThreshold: Number(val) })}
                                    disabled={isSaving}
                                    min={1}
                                    max={10}
                                    placeholder="Hibatűrés (küszöb)"
                                />

                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-slate-400 text-sm">
                        <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                        <p>A(z) {activeKind} szonda jelenleg inaktív ennél a workloadnál.</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Kapcsold be a fenti kapcsolóval a paraméterek szerkesztéséhez és aktiválásához.
                        </p>
                    </div>
                )}
            </form>
        </Modal>
    );
};
