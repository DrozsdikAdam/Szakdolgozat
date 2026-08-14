import { useEffect, useState } from "react";
import type { UserEditModalProps } from "../../../types/user/UserProps";
import type { UserRole, UserUpdateRequest } from "../../../types/user/User";
import { updateUser } from "../../../services/userService";
import { Check, Save } from "lucide-react";
import { ROLE_OPTIONS } from "../../../constants/roles"
import { Modal } from "../../common/Modal"
import { validateUsername, validateEmail, validatePhoneNumber, validateRequired } from "../../../utils/validators"


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
        const err = validateUsername(formData.username)
            || validateEmail(formData.email)
            || validatePhoneNumber(formData.phoneNumber, true)
            || validateRequired(formData.roles, "szerepkörök");

        if (err) { setError(err); return false }
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
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Felhasználó szerkesztése"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            submitIcon={<Save size={16} />}
            cancelText="Mégse"
            maxWidth="max-w-md"
        >
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
                    {ROLE_OPTIONS.map(role => {
                        const isSelected = formData.roles.includes(role.key)
                        return (
                            <button
                                type="button"
                                key={role.key}
                                onClick={() => handleRoles(role.key as UserRole)}
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
        </Modal>
    )
}