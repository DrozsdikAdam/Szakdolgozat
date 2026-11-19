import type { GoldenSignalCardProps } from "../../../types/component/telemetry";
import { Card } from "../../common/Card";
import { Skeleton } from "../../common/Skeleton";

export const GoldenSignalCard = ({ title, icon, iconBoxClassName = "text-cud-skyblue bg-slate-800/80 border-slate-700/60", value, unit, footer, children, isLoading = false }: GoldenSignalCardProps) => {
    if (isLoading) {
        return (
            <Card hoverEffect={false} className="h-36 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <Skeleton variant="text" className="w-24 h-3.5" />
                    <Skeleton variant="rounded" className="w-8 h-8" />
                </div>
                <Skeleton variant="text" className="w-32 h-8 my-2" />
                <Skeleton variant="circular" className="w-20 h-5" />
            </Card>
        );
    }

    return (
        <Card hoverEffect={false} className="flex flex-col justify-between min-h-36">
            <div>
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {title}
                    </p>
                    <div className={`p-2 rounded-xl border ${iconBoxClassName}`}>
                        {icon}
                    </div>
                </div>
                {value !== undefined && (
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-2xl sm:text-3xl font-bold text-slate-100">
                            {value}
                        </span>
                        {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
                    </div>
                )}
                {children}
            </div>
            {footer && <div className="pt-2">{footer}</div>}
        </Card>
    );
};
