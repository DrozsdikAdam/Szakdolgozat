import { useState } from "react"
import type { UserCreateModalProps } from "../../../types/user/UserProps"
import type { UserCreateRequest, UserRole } from "../../../types/user/User"
import { Check, Plus } from "lucide-react"
import { createUser } from "../../../services/userService"
import { ROLE_OPTIONS } from "../../../constants/roles"
import { Modal } from "../../common/Modal"
import { validateUsername, validateEmail, validatePassword, validatePasswordConfirmation, validatePhoneNumber, validateRequired } from "../../../utils/validators"
import { InputField } from "../../common/form/InputField"
import { PasswordField } from "../../common/form/PasswordField"

export const CreateUser = ({ isOpen, closeModal, onSuccess }: UserCreateModalProps) => {
    const [username, setUsername] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [passwordConfirmation, setPasswordConfirmation] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [roles, setRoles] = useState<UserRole[]>(["OPERATOR"])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        const err = validateUsername(username)
            || validateEmail(email)
            || validatePassword(password)
            || validatePasswordConfirmation(password, passwordConfirmation)
            || validatePhoneNumber(phoneNumber, true)
            || validateRequired(roles, "szerepkörök");
        if (err) { setError(err); return false; }
        return true;
    }

    const handleRoleChange = (role: UserRole) => {
        setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
    }

    const handleSubmit = async () => {
        if (!isValid()) return
        setIsLoading(true)
        setError(null)

        const userCreateRequest: UserCreateRequest = {
            username,
            email,
            password,
            phoneNumber,
            roles
        }

        try {
            await createUser(userCreateRequest)
            onSuccess()
            closeModal()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Új felhasználó létrehozása"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Létrehozás"
            submitIcon={<Plus size={18} />}
            cancelText="Mégse"
        >
            <InputField
                label="Név"
                placeholder="Név..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <InputField
                label="E-mail"
                type="email"
                placeholder="E-mail..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <InputField
                label="Telefonszám"
                type="tel"
                placeholder="Telefonszám..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <PasswordField
                label="Jelszó"
                placeholder="Adja meg jelszavát"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <PasswordField
                label="Jelszó megerősítése"
                placeholder="Adja meg jelszavát újra"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
            />

            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Válassza ki a felhasználó szerepét</label>
                <div className="grid grid-cols-2 gap-2.5">
                    {ROLE_OPTIONS.map(role => {
                        const isSelected = roles.includes(role.key as UserRole)
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
        </Modal>
    )
}

