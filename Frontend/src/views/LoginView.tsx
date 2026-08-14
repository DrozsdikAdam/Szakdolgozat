import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/UseAuth";
import { Navigate, useLocation } from "react-router-dom";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Background } from "../components/common/Background";

export const LoginView = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [error, setError] = useState("");
    const { user, login, loading } = useAuth();
    const location = useLocation();
    const targetPath = location.state?.from?.pathname || (typeof location.state?.from === "string" ? location.state.from : "/product");
    const from = (targetPath !== "/" && targetPath !== "/login" && targetPath !== "/unauthorized") ? targetPath : "/product";

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setUsernameError("");
        setPasswordError("");
        setError("");

        if (!verifyUsername() || !verifyPassword()) return;

        try {
            await login(username, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }

    const verifyUsername = (): boolean => {
        if (username.length === 0) {
            setUsernameError("A felhasználónév kitöltése kötelező");
            return false;
        }
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            setUsernameError("A felhasználónév csak betűket és számokat tartalmazhat");
            return false;
        }
        return true;
    }

    const verifyPassword = (): boolean => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (password.length === 0) {
            setPasswordError("A jelszó kitöltése kötelező");
            return false;
        }
        if (!passwordRegex.test(password)) {
            setPasswordError("A jelszónak legalább 8 karakterből kell állnia, és tartalmaznia kell 1 betűt, 1 számot és 1 speciális karaktert");
            return false;
        }
        return true;
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
                    {/* Username Input Field */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="username" className="text-sm font-semibold text-gray-300">Felhasználónév</label>
                        <div className="relative">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Adja meg felhasználónevét"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-4 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                            />
                        </div>
                        {usernameError && <p className="text-red-400 text-xs font-medium mt-1">{usernameError}</p>}
                    </div>

                    {/* Password Input Field with Toggle Visibility */}
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
                        {passwordError && <p className="text-red-400 text-xs font-medium mt-1">{passwordError}</p>}
                    </div>

                    {/* General Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3.5 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoaderCircle className="animate-spin h-5 w-5 text-white" size={20} />
                            </span>
                        ) : (
                            "Bejelentkezés"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
