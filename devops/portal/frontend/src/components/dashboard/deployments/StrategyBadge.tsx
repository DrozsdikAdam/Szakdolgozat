import { RefreshCw, Layers, Sliders } from "lucide-react";
import type { StrategyBadgeProps } from "../../../types/component/deployments/strategyBadgeProps";

export const StrategyBadge = ({ strategy, className = "" }: StrategyBadgeProps) => {
    switch (strategy) {
        case "Canary":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cud-orange/15 text-cud-orange border border-cud-orange/30 ${className}`}
                >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Canary Release</span>
                </span>
            );
        case "BlueGreen":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cud-teal/15 text-cud-teal border border-cud-teal/30 ${className}`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Blue / Green</span>
                </span>
            );
        case "RollingUpdate":
        default:
            return (
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cud-skyblue/15 text-cud-skyblue border border-cud-skyblue/30 ${className}`}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rolling Update</span>
                </span>
            );
    }
};
