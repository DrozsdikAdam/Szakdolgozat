import { Archive, CheckCircle2, Cloud } from "lucide-react"
import type { BackupStatsProps } from "../../../types/component/backup/backupStatsProps"
import { StatCard } from "../../common/StatCard"

export const BackupStats = ({ totalCount, latestBackup, syncedCount }: BackupStatsProps) => {
    const syncPercentage = totalCount === 0 ? "0%" : `${Math.round((syncedCount / totalCount) * 100)}%`
    const latestSize = latestBackup ? `${(latestBackup.size / (1024 * 1024)).toFixed(2)} MB` : "Nincs mentés"

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                title="Összes Mentés"
                value={totalCount}
                icon={<Archive className="w-5 h-5" />}
                iconBoxClassName="bg-slate-800/80 text-cud-skyblue border border-slate-700/60"
            />
            <StatCard
                title="Legutóbbi Mentés Mérete"
                value={latestSize}
                icon={<CheckCircle2 className="w-5 h-5" />}
                valueClassName="text-cud-teal"
                iconBoxClassName="bg-cud-teal-bg text-cud-teal border border-cud-teal-border"
            />
            <StatCard
                title="Szinkronizálva (S3)"
                value={syncPercentage}
                icon={<Cloud className="w-5 h-5" />}
                valueClassName="text-cud-purple"
                iconBoxClassName="bg-cud-purple-bg text-cud-purple border border-cud-purple-border"
            />
        </div>
    )
}