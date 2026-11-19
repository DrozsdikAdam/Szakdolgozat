import { ShieldCheck } from "lucide-react";
import type { LoginHeaderProps } from "../../types/component/auth";

export const LoginHeader = ({
    title = "DevOps PaaS Platform Belépés",
    subtitle = "Biztonságos hozzáférés a platform felügyeleti és orkesztrációs paneljéhez"
}: LoginHeaderProps) => {
    return (
        <div className="flex flex-col items-center text-center gap-3">
            <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-cud-skyblue/20 via-slate-800 to-cud-teal/20 border border-slate-700/80 flex items-center justify-center shadow-lg shadow-cud-skyblue/5">
                    <ShieldCheck className="w-7 h-7 text-cud-skyblue" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-cud-skyblue/10 blur-sm -z-10" />
            </div>

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                    {title}
                </h1>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};
