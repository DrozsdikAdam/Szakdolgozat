import { useState, type ReactNode } from "react";
import {
    ServerCrash,
    AlertTriangle,
    SearchX,
    Clock,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Terminal,
    ExternalLink
} from "lucide-react";
import type { ErrorStateProps, ErrorStateType } from "../../types/component/errorStateProps";
import { Badge } from "./Badge";
import { Button } from "./Button";

interface ErrorPreset {
    title: string;
    message: string;
    errorCode: string;
    badgeVariant: "teal" | "vermillon" | "orange" | "skyblue" | "purple" | "neutral";
    icon: ReactNode;
    iconBoxClass: string;
    defaultSteps: string[];
}

export const ErrorState = ({
    type = "generic",
    title,
    message,
    errorCode,
    targetService,
    targetUrl,
    troubleshootingSteps,
    onRetry,
    onBack,
    action,
    className = ""
}: ErrorStateProps) => {
    const [showSteps, setShowSteps] = useState<boolean>(false);

    const presets: Record<ErrorStateType, ErrorPreset> = {
        "connection-refused": {
            title: "A kapcsolat visszautasítva",
            message: targetService
                ? `A(z) ${targetService} szolgáltatás nem érhető el a megadott címen. Valószínűleg a Kubernetes pod még nem fut a klaszterben, vagy a port-forward kapcsolat megszakadt.`
                : "A célállomás visszautasította a csatlakozást. A kiszolgáló vagy konténer jelenleg nem fut a megadott porton.",
            errorCode: "ERR_CONNECTION_REFUSED",
            badgeVariant: "orange",
            icon: <ServerCrash className="w-8 h-8" />,
            iconBoxClass: "text-cud-orange bg-cud-orange-bg border-cud-orange-border",
            defaultSteps: [
                "Ellenőrizd a podok futását: kubectl get pods -n platform-infra",
                "Ellenőrizd a szolgáltatás port-forward kapcsolatát",
                "Győződj meg róla, hogy a K8s manifesztek sikeresen települtek"
            ]
        },
        "service-unavailable": {
            title: "A szolgáltatás átmenetileg nem elérhető",
            message: "A kért háttérszolgáltatás jelenleg nem tudja kiszolgálni a kérést. Lehetséges, hogy a pod újraindul, vagy a Readiness szonda még nem jelzett készenlétet.",
            errorCode: "503 SERVICE_UNAVAILABLE",
            badgeVariant: "vermillon",
            icon: <AlertTriangle className="w-8 h-8" />,
            iconBoxClass: "text-cud-vermillon bg-cud-vermillon-bg border-cud-vermillon-border",
            defaultSteps: [
                "Nézd meg a deployment állapotát: kubectl describe deployment <név>",
                "Vizsgáld meg a konténer naplóját (kubectl logs)",
                "Ellenőrizd a klaszter erőforrás-kihasználtságát"
            ]
        },
        "not-found": {
            title: "Az erőforrás nem található",
            message: "A keresett Kubernetes objektum, nézet vagy végpont nem található a megadott azonosítóval.",
            errorCode: "404 NOT_FOUND",
            badgeVariant: "skyblue",
            icon: <SearchX className="w-8 h-8" />,
            iconBoxClass: "text-cud-skyblue bg-cud-skyblue-bg border-cud-skyblue-border",
            defaultSteps: [
                "Ellenőrizd az URL-t vagy az erőforrás pontos nevét",
                "Győződj meg róla, hogy a megfelelő névtér (namespace) van kiválasztva"
            ]
        },
        "timeout": {
            title: "Kérés időtúllépés",
            message: "A kiszolgáló nem válaszolt a megadott időkorláton belül. Lehetséges hálózati túlterhelés vagy lassú háttérfolyamat.",
            errorCode: "504 GATEWAY_TIMEOUT",
            badgeVariant: "orange",
            icon: <Clock className="w-8 h-8" />,
            iconBoxClass: "text-cud-orange bg-cud-orange-bg border-cud-orange-border",
            defaultSteps: [
                "Próbáld újra a kérést pár másodperc múlva",
                "Ellenőrizd a hálózati késleltetést (latency) és a klaszter forgalmát"
            ]
        },
        "generic": {
            title: "Váratlan hiba történt",
            message: "Hiba lépett fel a művelet feldolgozása közben. Kérjük, próbáld újra a műveletet.",
            errorCode: "UNEXPECTED_ERROR",
            badgeVariant: "vermillon",
            icon: <AlertCircle className="w-8 h-8" />,
            iconBoxClass: "text-cud-vermillon bg-cud-vermillon-bg border-cud-vermillon-border",
            defaultSteps: [
                "Frissítsd az oldalt a legújabb adatok lekéréséhez",
                "Ellenőrizd a böngésző és a backend hibanaplóit"
            ]
        }
    };

    const currentPreset = presets[type];
    const displayTitle = title || currentPreset.title;
    const displayMessage = message || currentPreset.message;
    const displayCode = errorCode || currentPreset.errorCode;
    const steps = troubleshootingSteps && troubleshootingSteps.length > 0 ? troubleshootingSteps : currentPreset.defaultSteps;

    return (
        <div
            className={`p-6 sm:p-10 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl shadow-black/30 flex flex-col items-center text-center max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300 ${className}`}
        >
            <div className={`p-4 rounded-2xl border shadow-inner ${currentPreset.iconBoxClass}`}>
                {currentPreset.icon}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <Badge variant={currentPreset.badgeVariant} text={String(displayCode)} pulse />
                    {targetService && (
                        <Badge variant="neutral" text={targetService} />
                    )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                    {displayTitle}
                </h3>
            </div>

            <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                {displayMessage}
            </p>

            {targetUrl && (
                <div className="px-3.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2 max-w-full truncate">
                    <span className="text-slate-500">Végpont:</span>
                    <span className="text-slate-300 truncate">{targetUrl}</span>
                    <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cud-skyblue hover:text-cud-skyblue/80 ml-auto"
                        title="Megnyitás új lapon"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onRetry && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={onRetry}
                        icon={<RefreshCw className="w-4 h-4" />}
                    >
                        Újrapróbálkozás
                    </Button>
                )}
                {onBack && (
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={onBack}
                        icon={<ArrowLeft className="w-4 h-4" />}
                    >
                        Visszalépés
                    </Button>
                )}
                {action}
            </div>

            {steps.length > 0 && (
                <div className="w-full pt-4 border-t border-slate-800/80 text-left">
                    <button
                        type="button"
                        onClick={() => setShowSteps(!showSteps)}
                        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors py-1"
                    >
                        <span className="flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-cud-skyblue" />
                            Hibaelhárítási javaslatok (Troubleshooting)
                        </span>
                        {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showSteps && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono text-slate-300 animate-in fade-in duration-200">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className="text-cud-skyblue font-bold select-none">$</span>
                                    <span className="text-slate-300">{step}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
