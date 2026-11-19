import { AlertTriangle, RotateCcw } from "lucide-react";
import type { WorkloadTelemetryRowProps } from "../../../types/component/telemetry";
import { Badge } from "../../common/Badge";

export const WorkloadTelemetryRow = ({ workload }: WorkloadTelemetryRowProps) => {
    const isHealthy = workload.status === "Healthy";
    const isWarning = workload.status === "Warning";
    const statusVariant = isHealthy ? "teal" : isWarning ? "orange" : "vermillon";

    const oomVariant = workload.oomRisk === "High" ? "vermillon" : workload.oomRisk === "Medium" ? "orange" : "teal";
    const oomText = workload.oomRisk === "High" ? "Magas OOM" : workload.oomRisk === "Medium" ? "Közepes OOM" : "Alacsony";

    const hasThrottling = workload.cpuThrottlingEvents > 0;

    return (
        <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
            <td className="py-3.5 px-4">
                <div className="flex flex-col">
                    <span className="font-mono font-semibold text-slate-100 text-sm">
                        {workload.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {workload.namespace}
                    </span>
                </div>
            </td>

            <td className="py-3.5 px-4">
                <Badge
                    variant={statusVariant}
                    text={workload.status === "Healthy" ? "Egészséges" : workload.status === "Warning" ? "Figyelmeztetés" : "Kritikus"}
                />
            </td>

            <td className="py-3.5 px-4 font-mono text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-200 font-semibold">{workload.cpuUsedMilli}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">{workload.cpuLimitMilli} mCPU</span>
                    {hasThrottling && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-cud-orange-bg text-cud-orange border border-cud-orange-border">
                            <AlertTriangle className="w-3 h-3" />
                            {workload.cpuThrottlingEvents}x fojtás
                        </span>
                    )}
                </div>
            </td>

            <td className="py-3.5 px-4 font-mono text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <div>
                        <span className="text-slate-200 font-semibold">{workload.memoryUsedMb}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-slate-400">{workload.memoryLimitMb} MB</span>
                    </div>
                    <Badge variant={oomVariant} text={oomText} pulse={workload.oomRisk === "High"} size="sm" />
                </div>
            </td>

            <td className="py-3.5 px-4 font-mono text-xs">
                <div className="flex items-center gap-1.5">
                    <RotateCcw className={`w-3.5 h-3.5 ${workload.restarts > 0 ? "text-cud-orange" : "text-slate-600"}`} />
                    <span className={workload.restarts > 0 ? "text-cud-orange font-bold" : "text-slate-400"}>
                        {workload.restarts}
                    </span>
                </div>
            </td>
        </tr>
    );
};
