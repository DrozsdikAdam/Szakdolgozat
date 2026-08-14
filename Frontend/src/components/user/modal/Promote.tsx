import { useEffect, useState } from "react"
import type { UserPromoteModalProps } from "../../../types/user/UserProps"
import type { UserRole } from "../../../types/user/User"
import { promoteUser } from "../../../services/userService";
import { ArrowUp, Check, LoaderCircle, X } from "lucide-react";
import { ROLE_OPTIONS } from "../../../constants/roles"

export const PromoteUser = ({ isOpen, closeModal, user, onSuccess }: UserPromoteModalProps) => {

    const [roles, setRoles] = useState<UserRole[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const handleRoleChange = (role: UserRole) => {
        setRoles(prev => {
            if (prev.includes(role)) {
                return prev.filter(r => r !== role)
            } else {
                return [...prev, role]
            }
        })
    }

    const handleSubmit = async () => {
        if (!user) return
        if (roles.length === 0) {
            setError("A szerepkörök mező kitöltése kötelező!");
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await promoteUser(user.id, roles)
            onSuccess()
            closeModal()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen && user) {
            setRoles(user.roles)
            setError(null)
        }
    }, [isOpen, user])

    if (!isOpen || !user) return null

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">Felhasználó előléptetése</h1>
                    <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Válassza ki a felhasználó szerepét</label>

                        <div className="grid grid-cols-2 gap-2.5">
                            {ROLE_OPTIONS.map(role => {
                                const isSelected = roles.includes(role.key)
                                return (
                                    <button
                                        type="button"
                                        key={role.key}
                                        onClick={() => handleRoleChange(role.key as UserRole)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected
                                            ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/30"
                                            : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{role.label}</span>
                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-600 bg-slate-800"
                                            }`}>
                                            {isSelected && <Check size={13} strokeWidth={3} />}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {error && (
                        <p className="text-rose-400 text-xs font-medium text-center pt-1 animate-in fade-in duration-200">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-all"
                        >
                            Mégse
                        </button>
                        <button
                            disabled={isLoading}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            type="submit"
                        >
                            {isLoading ? (
                                <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                            ) : (
                                <>
                                    <ArrowUp size={16} />
                                    Előléptetés
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}