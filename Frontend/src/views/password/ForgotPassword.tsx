import { useState } from "react";
import { useNavigate } from "react-router-dom"
import { Background } from "../../components/common/Background";
import type { ForgotPasswordRequest } from "../../types/auth/auth";
import { requestPasswordReset } from "../../services/authService";
import { InputField } from "../../components/common/form/InputField";
import { SubmitButton } from "../../components/common/form/SubmitButton";
import { CheckCircleIcon } from "lucide-react";

export const ForgotPasswordView = () => {

    const [email, setEmail] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const navigation = useNavigate();

    const handleForgotPassword = async () => {
        setIsLoading(true);
        setError(null);

        const request: ForgotPasswordRequest = {
            email
        }

        try {
            const data = await requestPasswordReset(request);
            setSuccess(data.message);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hiba történt");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0f172a] overflow-hidden font-sans">
            <Background />
            <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/15">
                <div className="flex flex-col items-center mb-6">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight text-center">Elfelejtett jelszó</h2>
                    <p className="text-slate-400 text-sm mt-2 text-center">
                        Adja meg email címét, és elküldjük a visszaállító hivatkozást.
                    </p>
                </div>

                {!success &&
                    <form className="flex flex-col gap-5" onSubmit={(e) => {
                        e.preventDefault();
                        handleForgotPassword();
                    }}>

                        <InputField
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={error}
                            placeholder="Írd be az email címed..."
                        />
                        <div className="flex flex-col gap-4 mt-2">
                            <SubmitButton
                                loading={isLoading}
                                text="Jelszó igénylése"
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
                }

                {success &&
                    <div className="flex flex-col items-center space-y-4">
                        <CheckCircleIcon className="w-16 h-16 text-green-500" />
                        <p className="text-white text-center">{success}</p>
                        <button className="w-full py-3.5 px-4 rounded-xl text-base bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/20" onClick={() => navigation("/login")}>Vissza a bejelentkezéshez</button>
                    </div>
                }
            </div>
        </div>
    )
}