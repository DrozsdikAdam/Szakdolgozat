import { User, Lock, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";
import type { LoginFormProps } from "../../types/component/auth";
import { Input } from "../common/Input";
import { Button } from "../common/Button";

export const LoginForm = ({ username, onUsernameChange, password, onPasswordChange, onSubmit, error, isPasswordValid, validationMessage, disabled }: LoginFormProps) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (disabled || !isPasswordValid || !username.trim()) return;
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            {error && (
                <div className="p-3.5 rounded-xl bg-cud-vermillon-bg border border-cud-vermillon-border flex items-start gap-2.5 text-sm text-cud-vermillon animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                </div>
            )}

            <div className="flex flex-col gap-4">
                <Input
                    label="Felhasználónév"
                    icon={<User className="w-4 h-4" />}
                    placeholder="Adja meg a felhasználónevet"
                    value={username}
                    onChange={onUsernameChange}
                    disabled={disabled}
                    accentColor="skyblue"
                />

                <div className="flex flex-col">
                    <Input
                        label="Jelszó"
                        icon={<Lock className="w-4 h-4" />}
                        type="password"
                        placeholder="Adja meg a jelszót"
                        value={password}
                        onChange={onPasswordChange}
                        disabled={disabled}
                        accentColor="skyblue"
                    />

                    {password.length > 0 && !isPasswordValid && validationMessage && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400 font-normal">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <span>{validationMessage}</span>
                        </div>
                    )}

                    {password.length > 0 && isPasswordValid && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Jelszó formátuma megfelelő</span>
                        </div>
                    )}
                </div>
            </div>

            <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={disabled || !isPasswordValid || !username.trim()}
                icon={<LogIn className="w-4 h-4" />}
                className="w-full justify-center font-semibold mt-2 shadow-lg shadow-cud-skyblue/10"
            >
                Biztonságos Bejelentkezés
            </Button>
        </form>
    );
};
