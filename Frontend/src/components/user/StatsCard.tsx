import { useMemo } from "react";
import type { UserStatCardProps } from "../../types/user/UserProps";
import { ShieldCheck, UserCheck, Users, UserX, Wrench } from "lucide-react";

export const UserStatsCards = ({ users }: UserStatCardProps) => {

    const stats = useMemo(() => {
        const active = users.filter(u => u.active).length
        const inactive = users.length - active

        const operator = users.filter(u => u.roles.includes("OPERATOR")).length

        const admin = users.filter(u => u.roles.includes("SYSTEMADMIN") || u.roles.includes("CEO")).length

        const all = users.length

        return { active, inactive, operator, admin, all }
    }, [users])

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Összes</span>
                    <h3 className="text-2xl font-extrabold text-blue-400">{stats.all}</h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Users size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Aktív</span>
                    <h3 className="text-2xl font-extrabold text-amber-400">{stats.active}</h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <UserCheck size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Operátorok</span>
                    <h3 className="text-2xl font-extrabold text-emerald-400">{stats.operator}</h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Wrench size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Adminisztrátorok</span>
                    <h3 className="text-2xl font-extrabold text-purple-400">{stats.admin}</h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <ShieldCheck size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Inaktív</span>
                    <h3 className="text-2xl font-extrabold text-rose-400">{stats.inactive}</h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <UserX size={22} />
                </div>
            </div>
        </div>
    )
}