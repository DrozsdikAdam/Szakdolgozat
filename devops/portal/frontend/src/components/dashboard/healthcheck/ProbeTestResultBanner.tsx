import { Activity, X } from "lucide-react";
import type { ProbeTestResultDto } from "../../../types/healthcheck";

interface ProbeTestResultBannerProps {
    deployment: string;
    result: ProbeTestResultDto;
    onClose: () => void;
}

export const ProbeTestResultBanner = ({
    deployment,
    result,
    onClose
}: ProbeTestResultBannerProps) => {
    return (
        <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in duration-200 ${
                result.success
                    ? "bg-cud-teal/10 border-cud-teal/40 text-slate-200"
                    : "bg-cud-orange/10 border-cud-orange/40 text-slate-200"
            }`}
        >
            <div className="flex items-start gap-3">
                <Activity
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                        result.success ? "text-cud-teal" : "text-cud-orange"
                    }`}
                />
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-mono text-slate-100">
                            Ping Teszt Eredmény — {deployment}
                        </span>
                        {result.statusCode && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700">
                                HTTP {result.statusCode}
                            </span>
                        )}
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-cud-skyblue border border-slate-700">
                            {result.responseTimeMs} ms
                        </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                        {result.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                        Tesztelve: {new Date(result.testedAt).toLocaleTimeString()}
                    </span>
                </div>
            </div>
            <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors"
                title="Bezárás"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
