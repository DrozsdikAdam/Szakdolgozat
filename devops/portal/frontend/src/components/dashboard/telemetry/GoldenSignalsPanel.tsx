import { AlertOctagon, Clock, Gauge, Zap } from "lucide-react";
import type { GoldenSignalsPanelProps } from "../../../types/component/telemetry";
import { Badge } from "../../common/Badge";
import { GoldenSignalCard } from "./GoldenSignalCard";

export const GoldenSignalsPanel = ({ signals, isLoading }: GoldenSignalsPanelProps) => {
    if (isLoading || !signals) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <GoldenSignalCard key={i} title="" icon={null} isLoading={true} />
                ))}
            </div>
        );
    }

    const isHighError = signals.errorRatePercent > 5;
    const isMediumError = signals.errorRatePercent >= 1;
    const errorVariant = isHighError ? "vermillon" : isMediumError ? "orange" : "teal";
    const errorText = isHighError ? "Kritikus hibaszint" : isMediumError ? "Megnövekedett" : "Kiváló (<1%)";
    const errorIconColor = isHighError ? "text-cud-vermillon" : isMediumError ? "text-cud-orange" : "text-cud-teal";

    const isHighSaturation = signals.saturationPercent >= 80;
    const saturationVariant = isHighSaturation ? "orange" : "skyblue";
    const saturationText = isHighSaturation ? "Magas terhelés" : "Optimális kapacitás";
    const saturationBarColor = signals.saturationPercent > 85
        ? "bg-cud-vermillon"
        : signals.saturationPercent > 70
            ? "bg-cud-orange"
            : "bg-cud-skyblue";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
            <GoldenSignalCard
                title="Forgalom (RPS)"
                icon={<Zap className="w-4 h-4" />}
                iconBoxClassName="text-cud-orange bg-slate-800/80 border-slate-700/60"
                value={signals.rps}
                unit="req/s"
                footer={<Badge variant="orange" text="Live Traffic" pulse />}
            />

            <GoldenSignalCard
                title="Válaszidő (Latency)"
                icon={<Clock className="w-4 h-4" />}
                iconBoxClassName="text-cud-skyblue bg-slate-800/80 border-slate-700/60"
                value={signals.latencyP50}
                unit="ms (p50)"
                footer={
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="neutral" text={`p95: ${signals.latencyP95}ms`} />
                        <Badge variant="neutral" text={`p99: ${signals.latencyP99}ms`} />
                    </div>
                }
            />

            <GoldenSignalCard
                title="Hibaarány (Errors)"
                icon={<AlertOctagon className="w-4 h-4" />}
                iconBoxClassName={`${errorIconColor} bg-slate-800/80 border-slate-700/60`}
                value={signals.errorRatePercent}
                unit="%"
                footer={<Badge variant={errorVariant} text={errorText} pulse={isHighError} />}
            />

            <GoldenSignalCard
                title="Telítettség (Saturation)"
                icon={<Gauge className="w-4 h-4" />}
                iconBoxClassName="text-purple-400 bg-slate-800/80 border-slate-700/60"
                value={signals.saturationPercent}
                unit="%"
                footer={<Badge variant={saturationVariant} text={saturationText} pulse={isHighSaturation} />}
            >
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                        className={`h-full transition-all duration-300 ${saturationBarColor}`}
                        style={{ width: `${Math.min(signals.saturationPercent, 100)}%` }}
                    />
                </div>
            </GoldenSignalCard>
        </div>
    );
};

