import { Mail, Pencil, Phone } from "lucide-react"
import type { UserCardProps } from "../../types/user/UserProps"
import { UserStatusBadge, UserRoleBadge } from "../common/Badges"

export const Card = ({ user, onEdit, onPromote, onToggleStatus }: UserCardProps) => {
    return (
        <div className="flex flex-col rounded-2xl p-5 shadow-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl hover:border-slate-700/60 transition-all space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-200">{user.username}</h3>
                <UserStatusBadge status={user.active ? "ACTIVE" : "INACTIVE"} />
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    <p className="text-sm text-slate-400">Telefonszám: </p>
                    {user.phoneNumber ? (
                        <p className="text-sm text-slate-400">{user.phoneNumber}</p>
                    ) : (
                        <p className="text-sm text-slate-400">-</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    <p className="text-sm text-slate-400">E-mail: </p>
                    <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Szerepkörök:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((role, index) => (
                            <UserRoleBadge key={index} role={role} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-around">
                <button
                    onClick={() => onEdit(user)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                    <Pencil size={18} />
                </button>
                <button
                    onClick={() => onPromote(user)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                >
                    Szerepkörök
                </button>
                <button
                    onClick={() => onToggleStatus(user)}
                    className={`px-4 py-2 rounded-xl ${user.active ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
                        } text-white font-semibold text-sm transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40`}
                >
                    {user.active ? "Deaktiválás" : "Aktiválás"}
                </button>
            </div>
        </div>
    )
}