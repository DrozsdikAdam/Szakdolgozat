import { useState } from "react";
import { Background } from "../../components/common/Background"
import { useSearchParams, useNavigate } from "react-router-dom";
import type { ResetPasswordRequest } from "../../types/auth/auth";
import { resetPassword } from "../../services/authService";
import { validatePassword, validatePasswordConfirmation } from "../../utils/validators";
import { PasswordField } from "../../components/common/form/PasswordField";
import { SubmitButton } from "../../components/common/form/SubmitButton";
import { CheckCircle, XCircle } from "lucide-react";

export const ResetPasswordView = () => {

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigation = useNavigate();

    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [newError, setNewError] = useState<string | null>(null);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isValid = (): boolean => {

        const newError = validatePassword(newPassword)
        const confirmError = validatePassword(confirmPassword)
            || validatePasswordConfirmation(newPassword, confirmPassword);

        setNewError(newError)
        setConfirmError(confirmError)

        if (newError || confirmError) return false;
        return true;
    };

    const handleSubmit = async () => {
        if (!isValid()) return;
        setError(null)
        setIsLoading(true)

        if (!token) {
            setError("Hiányzó vagy érvénytelen token.");
            return;
        }

        const request: ResetPasswordRequest = {
            token,
            newPassword
        };

        try {
            const data = await resetPassword(request);
            setSuccess(data.message);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hiba történt a jelszó visszaállítása közben");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0f172a] overflow-hidden font-sans">
                <Background />
                <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl flex flex-col items-center gap-4 text-center">
                    <XCircle className="w-16 h-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-white">Érvénytelen hivatkozás</h2>
                    <p className="text-slate-400 text-sm">
                        A jelszó-visszaállító hivatkozás érvénytelen, vagy hiányzik belőle a biztonsági token.
                    </p>
                    <button
                        onClick={() => navigation("/forgot-password")}
                        className="w-full py-3.5 px-4 mt-2 rounded-xl text-base bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        Új jelszó igénylése
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0f172a] overflow-hidden font-sans">
            <Background />

            <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/15">
                <div className="flex flex-col items-center mb-6">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight text-center">Jelszó visszaállítása</h2>
                    <p className="text-slate-400 text-sm mt-2 text-center">
                        Adja meg az új jelszavát a fiókjához.
                    </p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <h3 className="text-xl font-bold text-white">Sikeres módosítás!</h3>
                        <p className="text-slate-300 text-sm">{success}</p>
                        <button
                            className="w-full py-3.5 px-4 rounded-xl text-base bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/20"
                            onClick={() => navigation("/login")}
                        >
                            Bejelentkezés az új jelszóval
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="flex flex-col gap-5"
                    >
                        <PasswordField
                            label="Új jelszó"
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onBlur={() => setNewError(validatePassword(newPassword))}
                            error={newError}
                            placeholder="Minimum 8 karakter, kis- és nagybetű, szám, speciális jel"
                        />
                        <PasswordField
                            label="Jelszó megerősítése"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onBlur={() => setConfirmError(validatePasswordConfirmation(newPassword, confirmPassword))}
                            error={confirmError}
                            placeholder="Erősítse meg az új jelszavát"
                        />

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                                <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 mt-2">
                            <SubmitButton
                                loading={isLoading}
                                text="Jelszó mentése"
                                className="w-full mt-2 py-3.5 px-4 rounded-xl text-base"
                            />

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => navigation("/login")}
                                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Vissza a bejelentkezéshez
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};