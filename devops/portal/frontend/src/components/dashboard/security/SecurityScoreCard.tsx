import { AlertTriangle, ShieldAlert, Wrench } from "lucide-react"
import type { SecurityScoreCardProps } from "../../../types/component/security"
import { GRADE_STYLES } from "../../../constants/security"
import { Card } from "../../common/Card"
import { StatCard } from "../../common/StatCard"
import { Badge } from "../../common/Badge"
import { Skeleton } from "../../common/Skeleton"

export const SecurityScoreCard = ({ overallScore, scoreGrade, criticalCount, highCount, fixableCount, isLoading = false }: SecurityScoreCardProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Skeleton className="h-32 lg:col-span-1" />
                <Skeleton className="h-32 lg:col-span-1" />
                <Skeleton className="h-32 lg:col-span-1" />
                <Skeleton className="h-32 lg:col-span-1" />
            </div>
        )
    }

    const gradeInfo = GRADE_STYLES[scoreGrade] || GRADE_STYLES.C

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card hoverEffect={false} className={`lg:col-span-1 p-5 border ${gradeInfo.borderClass} ${gradeInfo.bgClass}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Biztonsági Index
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className={`text-4xl font-extrabold ${gradeInfo.textClass}`}>
                                {overallScore}
                            </span>
                            <span className="text-sm font-medium text-slate-400">/ 100</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl border ${gradeInfo.borderClass} ${gradeInfo.bgClass} ${gradeInfo.textClass}`}>
                            {scoreGrade}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                    <Badge variant={gradeInfo.badgeVariant} text={`Grade ${scoreGrade}`} size="sm" />
                    <span className="text-xs text-slate-400 truncate text-right">
                        {gradeInfo.description}
                    </span>
                </div>
            </Card>

            <StatCard
                title="Kritikus Sebezhetőség"
                value={criticalCount}
                icon={<AlertTriangle className="w-5 h-5" />}
                valueClassName={criticalCount > 0 ? "text-cud-vermillon" : "text-slate-100"}
                iconBoxClassName={criticalCount > 0
                    ? "bg-cud-vermillon-bg text-cud-vermillon border border-cud-vermillon-border"
                    : "bg-slate-800/80 text-slate-400 border border-slate-700/60"}
            />

            <StatCard
                title="Magas Kockázat"
                value={highCount}
                icon={<ShieldAlert className="w-5 h-5" />}
                valueClassName={highCount > 0 ? "text-cud-orange" : "text-slate-100"}
                iconBoxClassName={highCount > 0
                    ? "bg-cud-orange-bg text-cud-orange border border-cud-orange-border"
                    : "bg-slate-800/80 text-slate-400 border border-slate-700/60"}
            />

            <StatCard
                title="Javítható (Patchable)"
                value={fixableCount}
                icon={<Wrench className="w-5 h-5" />}
                valueClassName="text-cud-skyblue"
                iconBoxClassName="bg-cud-skyblue-bg text-cud-skyblue border border-cud-skyblue-border"
            />
        </div>
    )
}
