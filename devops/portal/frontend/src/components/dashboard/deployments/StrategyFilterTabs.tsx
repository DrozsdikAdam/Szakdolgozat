import { Layers, RefreshCw, Zap, ArrowLeftRight } from "lucide-react";
import type { StrategyFilterType, StrategyFilterTabsProps } from "../../../types/component/deployments/strategyFilterTabsProps";

export const StrategyFilterTabs = ({ currentFilter, onSelectFilter, counts }: StrategyFilterTabsProps) => {
    const tabs: {
        id: StrategyFilterType;
        label: string;
        count: number;
        icon: React.ReactNode;
        activeColorClass: string;
    }[] = [
            {
                id: "all",
                label: "Összes stratégia",
                count: counts.all,
                icon: <Layers className="w-3.5 h-3.5" />,
                activeColorClass: "bg-slate-800 text-slate-100 border-slate-600 shadow-sm"
            },
            {
                id: "RollingUpdate",
                label: "Rolling Update",
                count: counts.RollingUpdate,
                icon: <RefreshCw className="w-3.5 h-3.5 text-cud-teal" />,
                activeColorClass: "bg-cud-teal/15 text-cud-teal border-cud-teal/40 shadow-sm"
            },
            {
                id: "Canary",
                label: "Canary",
                count: counts.Canary,
                icon: <Zap className="w-3.5 h-3.5 text-cud-orange" />,
                activeColorClass: "bg-cud-orange/15 text-cud-orange border-cud-orange/40 shadow-sm"
            },
            {
                id: "BlueGreen",
                label: "Blue / Green",
                count: counts.BlueGreen,
                icon: <ArrowLeftRight className="w-3.5 h-3.5 text-cud-skyblue" />,
                activeColorClass: "bg-cud-skyblue/15 text-cud-skyblue border-cud-skyblue/40 shadow-sm"
            }
        ];

    return (
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80 overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = currentFilter === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onSelectFilter(tab.id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${isActive
                            ? tab.activeColorClass
                            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive
                                ? "bg-slate-900/80 font-bold"
                                : "bg-slate-800/60 text-slate-400"
                                }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
