import { Activity, RefreshCw, Radio, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { TelemetryHeaderProps } from "../../../types/component/telemetry";
import type { TelemetryTimeRange, TelemetrySourceStatus } from "../../../types/telemetry";
import { Button } from "../../common/Button";

const TIME_RANGES: { value: TelemetryTimeRange; label: string }[] = [
    { value: "15m", label: "15p" },
    { value: "1h", label: "1ó" },
    { value: "6h", label: "6ó" },
    { value: "24h", label: "24ó" }
];

export const TelemetryHeader = ({
    sources,
    selectedRange,
    onRangeChange,
    onRefresh,
    isLoading = false
}: TelemetryHeaderProps) => {
    const renderSourceStatus = (sourceKey: string, defaultName: string) => {
        const source: TelemetrySourceStatus | undefined = sources[sourceKey] || sources[sourceKey.toLowerCase()];
        const status = source?.status || "Offline";
        const name = source?.name || defaultName;

        const isOnline = status === "Online";
        const isDegraded = status === "Degraded";

        const dotColor = isOnline
            ? "bg-cud-teal shadow-[0_0_8px_rgba(46,196,182,0.6)]"
            : isDegraded
                ? "bg-cud-orange shadow-[0_0_8px_rgba(255,159,28,0.6)]"
                : "bg-cud-vermillon shadow-[0_0_8px_rgba(231,76,60,0.6)]";

        const textColor = isOnline
            ? "text-cud-teal"
            : isDegraded
                ? "text-cud-orange"
                : "text-cud-vermillon";

        const Icon = isOnline ? CheckCircle2 : isDegraded ? AlertTriangle : XCircle;

        return (
            <div
                key={sourceKey}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
            >
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dotColor} ${isOnline ? "animate-pulse" : ""}`} />
                    <span className="font-semibold text-slate-300">{name}</span>
                </div>
                <span className="text-slate-600">|</span>
                <span className={`flex items-center gap-1 font-mono font-medium ${textColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {status === "Online" ? "Online" : status === "Degraded" ? "Degradált" : "Offline"}
                </span>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/20 space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-cud-skyblue shrink-0 shadow-inner">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                                Megfigyelhetőség & Metrikák
                            </h1>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cud-skyblue border border-slate-700 flex items-center gap-1">
                                <Radio className="w-3 h-3 animate-pulse text-cud-teal" />
                                Live Telemetry
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                            Prometheus metrikák, SRE Golden Signals és beágyazott Grafana dashboardok valós időben
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {renderSourceStatus("prometheus", "Prometheus")}
                        {renderSourceStatus("grafana", "Grafana")}
                    </div>

                    <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800">
                        {TIME_RANGES.map((range) => {
                            const isSelected = selectedRange === range.value;
                            return (
                                <button
                                    key={range.value}
                                    type="button"
                                    onClick={() => onRangeChange(range.value)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 ${isSelected
                                            ? "bg-cud-skyblue text-slate-950 font-bold shadow-sm"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                        }`}
                                >
                                    {range.label}
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cud-skyblue" : ""}`} />}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>
        </div>
    );
};
