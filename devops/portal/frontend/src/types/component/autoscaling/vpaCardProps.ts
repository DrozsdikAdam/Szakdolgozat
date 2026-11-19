import type { VpaOverviewDto } from "../../k8s";

export interface VpaCardProps {
    currentVpa: VpaOverviewDto | null;
    selectMode: 'Auto' | 'Off';
    selectMinCpu: string;
    selectMaxCpu: string;
    selectMinMemory: string;
    selectMaxMemory: string;
    onModeChange: (mode: 'Auto' | 'Off') => void;
    onMinCpuChange: (val: string) => void;
    onMaxCpuChange: (val: string) => void;
    onMinMemoryChange: (val: string) => void;
    onMaxMemoryChange: (val: string) => void;
    onSave: () => void;
    isLoading: boolean;
}
