import { AlertTriangle, CheckCircle2, FileText } from "lucide-react"
import type { auditStatsProps } from "../../../types/component/audit/auditStatsProps"
import { StatCard } from "../../common/StatCard"

export const AuditStats = ({ totalLogs, successCount, failedCount }: auditStatsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                title="Összes Log"
                value={totalLogs}
                icon={<FileText className="w-5 h-5" />}
                iconBoxClassName="bg-slate-800/80 text-cud-skyblue border border-slate-700/60"
            />
            <StatCard
                title="Sikeres Logok"
                value={successCount}
                icon={<CheckCircle2 className="w-5 h-5" />}
                valueClassName="text-cud-teal"
                iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
            />
            <StatCard
                title="Hibás Logok"
                value={failedCount}
                icon={<AlertTriangle className="w-5 h-5" />}
                valueClassName="text-cud-vermillon"
                iconBoxClassName="bg-cud-vermillon-bg text-cud-vermillon border border-cud-vermillon-border" />
        </div>
    )
}