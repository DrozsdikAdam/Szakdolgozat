import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/UseAuth";
import { Navigate, useLocation, Link } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Background } from "../components/common/Background";
import { InputField } from "../components/common/form/InputField";
import { PasswordField } from "../components/common/form/PasswordField";
import { SubmitButton } from "../components/common/form/SubmitButton";
import { validatePassword, validateUsername } from "../utils/validators";

export const LoginView = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { user, login, loading } = useAuth();
    const location = useLocation();
    const targetPath = location.state?.from?.pathname || (typeof location.state?.from === "string" ? location.state.from : "/");
    const from = (targetPath !== "/login" && targetPath !== "/unauthorized") ? targetPath : "/";

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setUsernameError(null);
        setPasswordError(null);
        setError("");

        const uErr = validateUsername(username);
        const pErr = validatePassword(password);
        if (uErr || pErr) {
            setUsernameError(uErr);
            setPasswordError(pErr);
            return;
        }

        try {
            await login(username, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }

    if (loading) return <LoadingSpinner />;
    if (user) return <Navigate to={from} replace />;

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0f172a] overflow-hidden font-sans">

            <Background />

            <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/15">
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight text-center">Bejelentkezés</h2>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <InputField
                        label="Felhasználónév"
                        id="username"
                        name="username"
                        placeholder="Adja meg felhasználónevét"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => setUsernameError(validateUsername(username))}
                        error={usernameError}
                    />

                    <PasswordField
                        label="Jelszó"
                        id="password"
                        name="password"
                        placeholder="Adja meg jelszavát"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordError(validatePassword(password))}
                        error={passwordError}
                    />

                    <div className="flex justify-end -mt-2">
                        <Link
                            to="/forgot-password"
                            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Elfelejtette jelszavát?
                        </Link>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                            <span>{error}</span>
                        </div>
                    )}

                    <SubmitButton
                        loading={loading}
                        text="Bejelentkezés"
                        className="w-full mt-2 py-3.5 px-4 rounded-xl text-base"
                    />

                </form>
            </div>
        </div>
    );
};
