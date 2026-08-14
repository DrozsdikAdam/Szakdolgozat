import { useState } from "react"
import type { UserCreateModalProps } from "../../../types/user/UserProps"
import type { UserCreateRequest, UserRole } from "../../../types/user/User"
import { Eye, EyeOff, Check, Plus } from "lucide-react"
import { createUser } from "../../../services/userService"
import { ROLE_OPTIONS } from "../../../constants/roles"
import { Modal } from "../../common/Modal"
import { validateUsername, validateEmail, validatePassword, validatePasswordConfirmation, validatePhoneNumber, validateRequired } from "../../../utils/validators"

export const CreateUser = ({ isOpen, closeModal, onSuccess }: UserCreateModalProps) => {

    const [username, setUsername] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [passwordConfirmation, setPasswordConfirmation] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [roles, setRoles] = useState<UserRole[]>(["OPERATOR"])
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false)
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
        setRoles(prev => {
            if (prev.includes(role)) {
                return prev.filter(r => r !== role)
            } else {
                return [...prev, role]
            }
        })
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
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Név</label>
                <input
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    type="text"
                    placeholder="Név..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
                <input
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    type="text"
                    placeholder="E-mail..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Telefonszám</label>
                <input
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    type="text"
                    placeholder="Telefonszám..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-gray-300">Jelszó</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="Adja meg jelszavát"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200 outline-none"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="passwordConfirmation" className="text-sm font-semibold text-gray-300">Jelszó megerősítése</label>
                <div className="relative">
                    <input
                        type={showPasswordConfirmation ? "text" : "password"}
                        id="passwordConfirmation"
                        name="passwordConfirmation"
                        placeholder="Adja meg jelszavát"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200 outline-none"
                    >
                        {showPasswordConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

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
        </Modal>
    )
}