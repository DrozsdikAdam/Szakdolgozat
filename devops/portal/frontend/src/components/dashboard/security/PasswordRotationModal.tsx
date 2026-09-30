import { CheckCircle2, Circle, KeyRound, ShieldAlert } from "lucide-react"
import type { PasswordRotationModalProps } from "../../../types/component/security"
import { PASSWORD_ROTATION_RULES } from "../../../constants/security"
import { Modal } from "../../common/Modal"
import { Input } from "../../common/Input"
import { Button } from "../../common/Button"

export const PasswordRotationModal = ({
    isOpen,
    onClose,
    onSubmit,
    password,
    onPasswordChange,
    isRotating,
    error
}: PasswordRotationModalProps) => {
    const rules = PASSWORD_ROTATION_RULES.map((rule) => ({
        id: rule.id,
        label: rule.label,
        valid: rule.validator(password)
    }))

    const allRulesPassed = rules.every((r) => r.valid)

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!allRulesPassed || isRotating) return
        await onSubmit()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Root / Admin Jelszó Rotálása"
            subtitle="Biztonságos jelszómódosítás és K8s Secret frissítés"
            icon={<KeyRound className="w-5 h-5 text-cud-skyblue" />}
            maxWidth="lg"
            className="h-auto! max-h-[90vh]"
            footer={
                <div className="flex items-center justify-end gap-3 p-4">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                        disabled={isRotating}
                    >
                        Mégse
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleSubmit()}
                        loading={isRotating}
                        disabled={!allRulesPassed || isRotating}
                        icon={<KeyRound className="w-4 h-4" />}
                    >
                        Jelszó Rotálása
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3 text-xs text-slate-300">
                    <ShieldAlert className="w-4 h-4 text-cud-teal shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                        A jelszó megváltoztatása azonnal frissíti a PaaS Portál adminisztrátori hitelesítési adatait és a kapcsolódó K8s Secret-et, valamint bekerül a biztonsági audit naplóba.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Input
                        label="Új adminisztrátori jelszó"
                        type="password"
                        value={password}
                        onChange={onPasswordChange}
                        placeholder="Adjon meg egy biztonságos jelszót..."
                        disabled={isRotating}
                        error={error || undefined}
                        accentColor="teal"
                    />
                </div>

                <div className="mt-1 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Jelszóerősségi követelmények:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {rules.map((rule) => (
                            <div
                                key={rule.id}
                                className={`flex items-center gap-2 transition-colors ${rule.valid ? "text-emerald-400 font-medium" : "text-slate-500"
                                    }`}
                            >
                                {rule.valid ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                ) : (
                                    <Circle className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                                )}
                                <span className="truncate">{rule.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    )
}
