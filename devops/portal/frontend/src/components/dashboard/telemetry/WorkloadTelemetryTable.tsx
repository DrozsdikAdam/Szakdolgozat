import { Layers, Server } from "lucide-react";
import type { WorkloadTelemetryTableProps } from "../../../types/component/telemetry";
import { Card } from "../../common/Card";
import { Select } from "../../common/Select";
import { EmptyState } from "../../common/EmptyState";
import { Skeleton } from "../../common/Skeleton";
import { WorkloadTelemetryRow } from "./WorkloadTelemetryRow";

const NAMESPACE_OPTIONS = [
    { value: "all", label: "Minden névtér (All)" },
    { value: "platform-infra", label: "platform-infra" },
    { value: "app-mes", label: "app-mes" }
];

export const WorkloadTelemetryTable = ({ workloads, selectedNamespace = "all", onNamespaceChange, isLoading = false }: WorkloadTelemetryTableProps) => {
    return (
        <Card hoverEffect={false} className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-cud-skyblue">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-100">
                            Workload és Konténer Terheltségi Metrikák
                        </h3>
                        <p className="text-xs text-slate-400">
                            Pod szintű CPU throttling, memória arány és OOM kockázat
                        </p>
                    </div>
                </div>

                {onNamespaceChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Névtér:</span>
                        <Select
                            value={selectedNamespace}
                            onChange={(val) => onNamespaceChange(val as string)}
                            options={NAMESPACE_OPTIONS}
                        />
                    </div>
                )}
            </div>

            <div className="overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <th className="py-3 px-4">Workload & Névtér</th>
                            <th className="py-3 px-4">Állapot</th>
                            <th className="py-3 px-4">CPU Használat</th>
                            <th className="py-3 px-4">Memória & OOM Kockázat</th>
                            <th className="py-3 px-4">Újraindulás</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i} className="border-b border-slate-800/50">
                                    <td className="py-4 px-4">
                                        <Skeleton variant="text" className="w-28 h-4 mb-1" />
                                        <Skeleton variant="text" className="w-16 h-3" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton variant="circular" className="w-20 h-5" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton variant="text" className="w-32 h-4" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton variant="text" className="w-36 h-4" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton variant="circular" className="w-8 h-4" />
                                    </td>
                                </tr>
                            ))
                        ) : workloads.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8">
                                    <EmptyState
                                        icon={<Server className="w-6 h-6" />}
                                        title="Nincs megjeleníthető workload"
                                        description="A kiválasztott névtérben jelenleg nem található futó pod."
                                    />
                                </td>
                            </tr>
                        ) : (
                            workloads.map((workload) => (
                                <WorkloadTelemetryRow
                                    key={`${workload.namespace}/${workload.name}`}
                                    workload={workload}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
