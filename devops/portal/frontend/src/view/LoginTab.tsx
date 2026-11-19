import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLogin } from "../hooks/useLogin";
import { LoginHeader, LoginForm, LoginProgressBar } from "../components/auth";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { CheckCircle2, ArrowRight, LogOut, Shield } from "lucide-react";

export const LoginTab = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const {
        username,
        setUsername,
        password,
        setPassword,
        authStep,
        progress,
        progressState,
        stageText,
        error,
        isPasswordValid,
        validationMessage,
        handleSubmit
    } = useLogin();

    if (auth.isAuthenticated) {
        return (
            <div className="w-full max-w-lg mx-auto py-12 flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-8 flex flex-col gap-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <div className="flex flex-col gap-2 items-center">
                        <Badge variant="teal" text={`Bejelentkezve: ${auth.username}`} size="md" />
                        <h2 className="text-2xl font-bold text-slate-100">
                            Aktív Adminisztrátori Munkamenet
                        </h2>
                        <p className="text-sm text-slate-400 max-w-sm">
                            A böngésződ érvényes hitelesítési tokennel rendelkezik a platform orkesztrációs szolgáltatásaihoz.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => navigate("/")}
                            icon={<ArrowRight className="w-4 h-4" />}
                            className="justify-center"
                        >
                            Tovább a Szolgáltatáskatalógushoz
                        </Button>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => auth.logout()}
                            icon={<LogOut className="w-4 h-4" />}
                            className="justify-center hover:text-cud-vermillon"
                        >
                            Kijelentkezés
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto py-8 sm:py-12 flex flex-col items-center animate-in fade-in duration-300">
            <div className="w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-7 sm:p-8 flex flex-col gap-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-linear-to-r from-transparent via-cud-skyblue/40 to-transparent" />

                <LoginHeader />

                {authStep === "FORM" ? (
                    <LoginForm
                        username={username}
                        onUsernameChange={setUsername}
                        password={password}
                        onPasswordChange={setPassword}
                        onSubmit={handleSubmit}
                        error={error}
                        isPasswordValid={isPasswordValid}
                        validationMessage={validationMessage}
                        disabled={false}
                    />
                ) : (
                    <LoginProgressBar
                        progress={progress}
                        state={progressState}
                        stageText={stageText}
                        errorMessage={error}
                    />
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-cud-skyblue" />
                    <span>Zero-Trust PaaS Kapu • K8s Secret Védelem</span>
                </div>
            </div>
        </div>
    );
};
