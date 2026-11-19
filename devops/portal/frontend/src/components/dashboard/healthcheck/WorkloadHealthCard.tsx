import { Activity, CheckCircle2, HeartPulse, Sliders, Zap, Server, RotateCcw } from "lucide-react";
import type { WorkloadHealthCardProps } from "../../../types/component/healthcheck/workloadHealthCardProps";
import { Card } from "../../common/Card";
import { Badge } from "../../common/Badge";
import { Button } from "../../common/Button";
import { ProbeStatusBox } from "./ProbeStatusBox";
import { statusConfig } from "../../../constants/statusConfig";

export const WorkloadHealthCard = ({ workload, onEdit, onTest, isTesting }: WorkloadHealthCardProps) => {

    const currentStatus = statusConfig[workload.status] || {
        variant: 'neutral',
        label: workload.status,
        pulse: false
    };

    return (
        <Card
            hoverEffect={false}
            className="flex flex-col justify-between h-full bg-slate-900/60 border-slate-800"
        >
            <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-100 truncate font-mono">
                                {workload.name}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-mono">
                                {workload.namespace}
                            </span>
                        </div>
                        {workload.containerName && workload.containerName !== workload.name && (
                            <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
                                Konténer: {workload.containerName}
                            </p>
                        )}
                    </div>
                    <Badge
                        variant={currentStatus.variant}
                        text={currentStatus.label}
                        pulse={currentStatus.pulse}
                        size="sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Server className="w-4 h-4 text-cud-skyblue shrink-0" />
                        <span>Replikák:</span>
                        <span className="font-mono font-bold text-slate-100">
                            {workload.replicas.ready}/{workload.replicas.desired}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 justify-end">
                        <RotateCcw className={`w-3.5 h-3.5 ${workload.restartCount > 0 ? 'text-cud-orange' : 'text-slate-400'} shrink-0`} />
                        <span>Újraindulás:</span>
                        <span className={`font-mono font-bold ${workload.restartCount > 0 ? 'text-cud-orange' : 'text-slate-100'}`}>
                            {workload.restartCount}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3">
                    <ProbeStatusBox title="Startup" icon={<Zap className="w-3.5 h-3.5 text-cud-orange" />} probe={workload.startupProbe} />
                    <ProbeStatusBox title="Liveness" icon={<HeartPulse className="w-3.5 h-3.5 text-cud-vermillon" />} probe={workload.livenessProbe} />
                    <ProbeStatusBox title="Readiness" icon={<CheckCircle2 className="w-3.5 h-3.5 text-cud-teal" />} probe={workload.readinessProbe} />
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80 mt-2">
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<Activity className="w-3.5 h-3.5 text-cud-skyblue" />}
                    onClick={() => onTest(workload)}
                    loading={isTesting}
                    disabled={isTesting}
                    className="text-xs"
                >
                    Ping Teszt
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    icon={<Sliders className="w-3.5 h-3.5" />}
                    onClick={() => onEdit(workload)}
                    className="text-xs"
                >
                    Szondák
                </Button>
            </div>
        </Card>
    );
};