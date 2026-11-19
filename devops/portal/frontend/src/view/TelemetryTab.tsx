import { useTelemetry } from "../hooks/useTelemetry";
import { TelemetryHeader } from "../components/dashboard/telemetry/Header";
import { GoldenSignalsPanel } from "../components/dashboard/telemetry/GoldenSignalsPanel";
import { ClusterTelemetryMetrics } from "../components/dashboard/telemetry/ClusterTelemetryMetrics";
import { WorkloadTelemetryTable } from "../components/dashboard/telemetry/WorkloadTelemetryTable";
import { GrafanaDashboardEmbed } from "../components/dashboard/telemetry/GrafanaDashboardEmbed";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const TelemetryTab = () => {
    const {
        sources,
        signals,
        cluster,
        dashboards,
        filteredWorkloads,
        isLoading,
        isRefreshing,
        timeRange,
        setTimeRange,
        selectedNamespace,
        setSelectedNamespace,
        activeDashboardId,
        setActiveDashboardId,
        refresh,
        toastMessage
    } = useTelemetry();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {toastMessage && (
                <div
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all duration-300 ${toastMessage.type === "error"
                        ? "bg-cud-vermillon/10 border-cud-vermillon/40 text-cud-vermillon"
                        : "bg-cud-teal/10 border-cud-teal/40 text-cud-teal"
                        }`}
                >
                    {toastMessage.type === "error" ? (
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{toastMessage.text}</span>
                </div>
            )}

            <TelemetryHeader
                sources={sources}
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                onRefresh={refresh}
                isLoading={isRefreshing}
            />

            <GoldenSignalsPanel
                signals={signals!}
                isLoading={isLoading}
            />

            <ClusterTelemetryMetrics
                cluster={cluster!}
                isLoading={isLoading}
            />

            <WorkloadTelemetryTable
                workloads={filteredWorkloads}
                selectedNamespace={selectedNamespace}
                onNamespaceChange={setSelectedNamespace}
                isLoading={isLoading}
            />

            <GrafanaDashboardEmbed
                dashboards={dashboards}
                activeDashboardId={activeDashboardId}
                onSelectDashboard={setActiveDashboardId}
                isOnline={sources["grafana"]?.status === "Online"}
            />
        </div>
    );
};

