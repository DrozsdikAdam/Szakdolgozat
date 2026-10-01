import { Loader2, AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import type { LoginProgressProps } from "../../types/component/auth";
import { Badge } from "../common/Badge";

export const LoginProgressBar = ({ progress, state, stageText, errorMessage }: LoginProgressProps) => {
    const isFailed = state === "failed";
    const isSuccess = state === "success";

    const barBgColor = isFailed
        ? "bg-cud-vermillon"
        : isSuccess
            ? "bg-cud-teal"
            : "bg-cud-skyblue";

    const barShadowColor = isFailed
        ? "shadow-cud-vermillon/40"
        : isSuccess
            ? "shadow-cud-teal/40"
            : "shadow-cud-skyblue/30";

    const statusBadge = isFailed ? (
        <Badge variant="vermillon" text="Megtagadva (75%)" pulse={true} size="sm" />
    ) : isSuccess ? (
        <Badge variant="teal" text="Sikeres belépés" size="sm" />
    ) : (
        <Badge variant="skyblue" text="Ellenőrzés..." pulse={true} size="sm" />
    );

    const statusIcon = isFailed ? (
        <AlertTriangle className="w-5 h-5 text-cud-vermillon animate-bounce shrink-0" />
    ) : isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-cud-teal shrink-0" />
    ) : (
        <Loader2 className="w-5 h-5 text-cud-skyblue animate-spin shrink-0" />
    );

    return (
        <div className="flex flex-col gap-6 w-full py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {statusIcon}
                    <span className="text-sm font-semibold text-slate-200">
                        {isFailed ? "Biztonsági Leállás" : isSuccess ? "Munkamenet Aktív" : "Biztonsági Kézfogás"}
                    </span>
                </div>
                <div>{statusBadge}</div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="w-full h-3 rounded-full bg-slate-800/80 border border-slate-700/60 p-0.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-100 ease-out shadow-lg ${barBgColor} ${barShadowColor}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>0%</span>
                    <span
                        className={`font-semibold text-sm ${isFailed
                            ? "text-cud-vermillon"
                            : isSuccess
                                ? "text-cud-teal"
                                : "text-cud-skyblue"
                            }`}
                    >
                        {progress}%
                    </span>
                    <span>100%</span>
                </div>
            </div>

            <div
                className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${isFailed
                    ? "bg-cud-vermillon-bg border-cud-vermillon-border text-cud-vermillon"
                    : isSuccess
                        ? "bg-cud-teal-bg border-cud-teal-border text-cud-teal"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300"
                    }`}
            >
                <Shield className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
                <div className="flex flex-col gap-1 text-xs">
                    <span className="font-medium leading-relaxed">{stageText}</span>
                    {errorMessage && isFailed && (
                        <span className="text-cud-vermillon/80">{errorMessage}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
