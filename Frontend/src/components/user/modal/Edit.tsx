import { useEffect, useState } from "react";
import type { UserEditModalProps } from "../../../types/user/UserProps";
import type { UserRole, UserUpdateRequest } from "../../../types/user/User";
import { updateUser } from "../../../services/userService";
import { Check, LoaderCircle, Save, X } from "lucide-react";

export const EditUser = ({ isOpen, closeModal, user, onSuccess }: UserEditModalProps) => {

    const [formData, setFormData] = useState<UserUpdateRequest>({
        username: "",
        email: "",
        phoneNumber: "",
        active: false,
        roles: []
    })
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const allRoles: { label: string, value: UserRole }[] = [
        { label: "Rendszergazda", value: "SYSTEMADMIN" },
        { label: "Vezérigazgató", value: "CEO" },
        { label: "Menedzser", value: "MANAGER" },
        { label: "Operátor", value: "OPERATOR" }
    ]

    const handleRoles = (role: UserRole) => {
        setFormData(prev => {
            if (prev.roles.includes(role)) {
                return { ...prev, roles: prev.roles.filter(r => r !== role) }
            } else {
                return { ...prev, roles: [...prev.roles, role] }
            }
        })
    }

    const isValid = (): boolean => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phoneNumberRegex = /^\+?[0-9]{7,}$/;
        const { username, email, phoneNumber, roles } = formData

        if (!username.trim()) {
            setError("A név mező kitöltése kötelező!");
            return false
        }
        if (!email.trim()) {
            setError("Az e-mail mező kitöltése kötelező!");
            return false
        }
        if (!phoneNumber.trim()) {
            setError("A telefonszám mező kitöltése kötelező!");
            return false
        }
        if (roles.length === 0) {
            setError("A szerepkörök mező kitöltése kötelező!");
            return false
        }
        if (username.length > 50 || username.length < 3) {
            setError("A felhasználónév mezőnek legalább 3 és legfeljebb 50 karakterből kell állnia!");
            return false
        }
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            setError("A felhasználónév csak betűket és számokat tartalmazhat!");
            return false
        }
        if (!emailRegex.test(email)) {
            setError("Az e-mail formátuma érvénytelen!");
            return false
        }
        if (!phoneNumberRegex.test(phoneNumber)) {
            setError("A telefonszám formátuma érvénytelen!");
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!user) return
        if (!isValid()) return
        setError(null)
        setIsLoading(true)

        try {
            await updateUser(user.id, formData)
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
            setFormData({
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber || "",
                active: user.active,
                roles: user.roles
            })
            setError(null)
        }
    }, [user, isOpen])

    if (!isOpen || !user) return null
    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">Felhasználó szerkesztése</h1>
                    <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Név</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="text"
                            placeholder="Név..."
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="text"
                            placeholder="E-mail..."
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Telefonszám</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="text"
                            placeholder="Telefonszám..."
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Válassza ki a felhasználó szerepét</label>

                        <div className="grid grid-cols-2 gap-2.5">
                            {allRoles.map(role => {
                                const isSelected = formData.roles.includes(role.value)
                                return (
                                    <button
                                        type="button"
                                        key={role.value}
                                        onClick={() => handleRoles(role.value)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                                            isSelected
                                                ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/30"
                                                : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                        }`}
                                    >
                                        <span className="text-sm font-medium">{role.label}</span>
                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                            isSelected ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-600 bg-slate-800"
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
                                    <Save size={16} />
                                    Mentés
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div >
        </div >
    )
}