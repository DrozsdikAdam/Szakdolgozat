import { Cpu, HardDrive, ArrowDownUp, Server, ArrowDown, ArrowUp } from "lucide-react";
import type { ClusterTelemetryMetricsProps } from "../../../types/component/telemetry";
import { Card } from "../../common/Card";
import { Badge } from "../../common/Badge";
import { Skeleton } from "../../common/Skeleton";
import { ResourceUsageCard } from "./ResourceUsageCard";

export const ClusterTelemetryMetrics = ({ cluster, isLoading }: ClusterTelemetryMetricsProps) => {
    if (isLoading || !cluster) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ResourceUsageCard
                    title=""
                    icon={null}
                    usage={0}
                    limit={0}
                    requests={0}
                    usagePercent={0}
                    unit=""
                    isLoading={true}
                />
                <ResourceUsageCard
                    title=""
                    icon={null}
                    usage={0}
                    limit={0}
                    requests={0}
                    usagePercent={0}
                    unit=""
                    isLoading={true}
                />
                <Card hoverEffect={false} className="h-48 animate-pulse flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <Skeleton variant="text" className="w-28 h-3.5" />
                        <Skeleton variant="rounded" className="w-8 h-8" />
                    </div>
                    <div className="space-y-2 my-2">
                        <Skeleton variant="text" className="w-36 h-7" />
                        <Skeleton variant="text" className="w-24 h-4" />
                    </div>
                    <Skeleton variant="circular" className="w-24 h-5" />
                </Card>
            </div>
        );
    }

    const cpuBadgeText = cluster.cpu.usagePercent > 80 ? "Magas terhelés" : "Optimális";
    const cpuBadgeVariant = cluster.cpu.usagePercent > 80 ? "orange" : "teal";

    const memBadgeText = cluster.memory.usagePercent > 85 ? "Kritikus memória" : cluster.memory.usagePercent > 70 ? "Fokozott" : "Normál";
    const memBadgeVariant = cluster.memory.usagePercent > 85 ? "vermillon" : cluster.memory.usagePercent > 70 ? "orange" : "teal";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
            <ResourceUsageCard
                title="CPU Erőforrás-gazdálkodás"
                icon={<Cpu className="w-4 h-4" />}
                iconBoxClassName="text-cud-teal bg-slate-800/80 border-slate-700/60"
                usage={cluster.cpu.usage}
                limit={cluster.cpu.limit}
                requests={cluster.cpu.requests}
                usagePercent={cluster.cpu.usagePercent}
                unit="mCPU"
                badgeText={cpuBadgeText}
                badgeVariant={cpuBadgeVariant}
            />

            <ResourceUsageCard
                title="Memória Foglaltság"
                icon={<HardDrive className="w-4 h-4" />}
                iconBoxClassName="text-cud-skyblue bg-slate-800/80 border-slate-700/60"
                usage={cluster.memory.usage}
                limit={cluster.memory.limit}
                requests={cluster.memory.requests}
                usagePercent={cluster.memory.usagePercent}
                unit="MB"
                badgeText={memBadgeText}
                badgeVariant={memBadgeVariant}
            />

            <Card hoverEffect={false} className="flex flex-col justify-between min-h-48">
                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Hálózati I/O & Csomópontok
                        </p>
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-purple-400">
                            <ArrowDownUp className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                                <ArrowDown className="w-3 h-3 text-cud-teal" />
                                <span>Bejövő (In)</span>
                            </div>
                            <span className="font-mono text-lg font-bold text-slate-100">
                                {cluster.network.inbound}
                            </span>
                            <span className="text-xs text-slate-400 font-mono ml-1">KB/s</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                                <ArrowUp className="w-3 h-3 text-cud-skyblue" />
                                <span>Kimenő (Out)</span>
                            </div>
                            <span className="font-mono text-lg font-bold text-slate-100">
                                {cluster.network.outbound}
                            </span>
                            <span className="text-xs text-slate-400 font-mono ml-1">KB/s</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono">
                        <Server className="w-3.5 h-3.5 text-slate-500" />
                        {cluster.nodes.active} / {cluster.nodes.total} aktív node
                    </span>
                    <Badge variant="teal" text="Egészséges hálózat" />
                </div>
            </Card>
        </div>
    );
};
