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
                    <h3 className="text-2xl font-extrabold text-cud-skyblue">{stats.all}</h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-skyblue-bg) border border-(--cud-skyblue-border) text-cud-skyblue">
                    <Users size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Aktív</span>
                    <h3 className="text-2xl font-extrabold text-cud-teal">{stats.active}</h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-teal-bg) border border-(--cud-teal-border) text-cud-teal">
                    <UserCheck size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Operátorok</span>
                    <h3 className="text-2xl font-extrabold text-cud-blue">{stats.operator}</h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-blue-bg) border border-(--cud-blue-border) text-cud-blue">
                    <Wrench size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Adminisztrátorok</span>
                    <h3 className="text-2xl font-extrabold text-cud-purple">{stats.admin}</h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-purple-bg) border border-(--cud-purple-border) text-cud-purple">
                    <ShieldCheck size={22} />
                </div>
            </div>

            <div className="stats-card shadow-xl">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Inaktív</span>
                    <h3 className="text-2xl font-extrabold text-cud-vermillon">{stats.inactive}</h3>
                </div>
                <div className="p-3 rounded-xl bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border) text-cud-vermillon">
                    <UserX size={22} />
                </div>
            </div>
        </div>
    )
}