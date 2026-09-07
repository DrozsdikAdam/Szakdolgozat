import { LoaderCircle } from "lucide-react";

export const LoadingSpinner = () => {
    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 flex flex-col items-center justify-center overflow-hidden">
            <LoaderCircle className="animate-spin text-cud-skyblue" size={40} />
            <span className="text-slate-200 text-sm font-semibold mt-3 tracking-wide animate-pulse">Betöltés...</span>
        </div>
    );
}