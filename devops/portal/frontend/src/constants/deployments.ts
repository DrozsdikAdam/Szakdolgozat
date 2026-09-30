import type { PipelineStatus } from "../types/pipeline"

export interface PipelineStatusStyleConfig {
    label: string
    bg: string
    text: string
    border: string
}

export const PIPELINE_STATUS_CONFIG: Record<PipelineStatus, PipelineStatusStyleConfig> = {
    success: {
        label: "Sikeres",
        bg: "bg-emerald-500/15",
        text: "text-emerald-400",
        border: "border-emerald-500/30"
    },
    in_progress: {
        label: "Folyamatban",
        bg: "bg-sky-500/15",
        text: "text-sky-400",
        border: "border-sky-500/30"
    },
    waiting_approval: {
        label: "Jóváhagyásra vár",
        bg: "bg-amber-500/20",
        text: "text-amber-300",
        border: "border-amber-500/40"
    },
    failed: {
        label: "Meghiúsult",
        bg: "bg-rose-500/15",
        text: "text-rose-400",
        border: "border-rose-500/30"
    },
    cancelled: {
        label: "Visszavonva",
        bg: "bg-slate-700/30",
        text: "text-slate-400",
        border: "border-slate-700"
    }
}
