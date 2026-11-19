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
            <Card
                hoverEffect={false}
                className={`lg:col-span-1 p-4 border ${gradeInfo.borderClass} ${gradeInfo.bgClass}`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Biztonsági Index
                            </p>
                            <Badge variant={gradeInfo.badgeVariant} text={`Grade ${scoreGrade}`} size="sm" />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <h4 className={`text-2xl font-bold ${gradeInfo.textClass}`}>
                                {overallScore}
                            </h4>
                            <span className="text-xs font-medium text-slate-400">/ 100</span>
                        </div>
                    </div>

                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xl border ${gradeInfo.borderClass} bg-slate-900/80 ${gradeInfo.textClass} shadow-sm shrink-0`}>
                        {scoreGrade}
                    </div>
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
