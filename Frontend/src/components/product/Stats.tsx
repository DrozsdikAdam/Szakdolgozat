import type { StatsProps } from "../../types/product/ProductProps"

export const Stats = ({ active, inactive, deleted }: StatsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="stats-card flex-col items-start! hover:border-slate-600/60 transition-all">
                <span className="text-muted font-medium text-xs uppercase tracking-wider">Összes termék</span>
                <span className="text-xl sm:text-2xl font-bold text-main mt-1">{active + inactive + deleted}</span>
            </div>

            <div className="stats-card flex-col items-start! hover:border-slate-600/60 transition-all">
                <span className="text-muted font-medium text-xs uppercase tracking-wider">Aktív termékek</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{active}</span>
            </div>

            <div className="stats-card flex-col items-start! hover:border-slate-600/60 transition-all">
                <span className="text-muted font-medium text-xs uppercase tracking-wider">Inaktív / Törölt</span>
                <span className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{inactive + deleted}</span>
            </div>
        </div>
    )
}