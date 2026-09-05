import { useEffect, useState } from "react"
import type { UserPromoteModalProps } from "../../../types/user/UserProps"
import type { UserRole } from "../../../types/user/User"
import { promoteUser } from "../../../services/userService";
import { ArrowUp, Check } from "lucide-react";
import { ROLE_OPTIONS } from "../../../constants/roles"
import { Modal } from "../../common/modal/Modal";
import { validateRequired } from "../../../utils/validators";

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
        const error = validateRequired(roles, "szerepkörök"); if (error) { setError(error); return; }
        setIsLoading(true)
        setError(null)
        try {
            await promoteUser(user!.id, roles)
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
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Felhasználó előléptetése"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Előléptetés"
            submitIcon={<ArrowUp size={16} />}
            cancelText="Mégse"
            maxWidth="max-w-md"
        >
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
                                    ? "bg-(--cud-skyblue-bg) border-(--cud-skyblue-border) text-white shadow-sm ring-1 ring-(--cud-skyblue-border)"
                                    : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                    }`}
                            >
                                <span className="text-sm font-medium">{role.label}</span>
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? "bg-(--cud-skyblue) border-(--cud-skyblue) text-slate-950 font-bold" : "border-slate-600 bg-slate-800"
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