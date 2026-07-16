import { LoaderCircle } from "lucide-react";

export const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0f172a] overflow-hidden">
            <LoaderCircle className="animate-spin" color="#3b82f6" size={40} />
            <span className="text-white text-sm font-semibold mt-2 animate-pulse">Betöltés...</span>
        </div>
    );
}