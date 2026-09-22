import type { ResourceUsageCardProps } from "../../../types/component/telemetry";
import { Card } from "../../common/Card";
import { Badge } from "../../common/Badge";
import { Skeleton } from "../../common/Skeleton";

export const ResourceUsageCard = ({ title, icon, iconBoxClassName = "text-cud-skyblue bg-slate-800/80 border-slate-700/60", usage, limit, requests, usagePercent, unit, badgeText, badgeVariant = "teal", isLoading = false }: ResourceUsageCardProps) => {
    if (isLoading) {
        return (
            <Card hoverEffect={false} className="h-48 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <Skeleton variant="text" className="w-28 h-3.5" />
                    <Skeleton variant="rounded" className="w-8 h-8" />
                </div>
                <div className="space-y-2 my-2">
                    <Skeleton variant="text" className="w-36 h-7" />
                    <Skeleton variant="rounded" className="w-full h-2" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton variant="text" className="w-24 h-3" />
                    <Skeleton variant="circular" className="w-16 h-5" />
                </div>
            </Card>
        );
    }

    const barColor = usagePercent > 85
        ? "bg-cud-vermillon"
        : usagePercent > 70
            ? "bg-cud-orange"
            : "bg-cud-teal";

    return (
        <Card hoverEffect={false} className="flex flex-col justify-between min-h-48">
            <div>
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {title}
                    </p>
                    <div className={`p-2 rounded-xl border ${iconBoxClassName}`}>
                        {icon}
                    </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="font-mono text-2xl font-bold text-slate-100">{usage}</span>
                        <span className="text-xs text-slate-400 font-mono">/ {limit} {unit}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-200">
                        {usagePercent}%
                    </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                        className={`h-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 mt-3 text-xs text-slate-400 font-mono">
                <span>Garantált kérés: {requests} {unit}</span>
                {badgeText && (
                    <Badge variant={badgeVariant} text={badgeText} pulse={usagePercent > 80} />
                )}
            </div>
        </Card>
    );
};
