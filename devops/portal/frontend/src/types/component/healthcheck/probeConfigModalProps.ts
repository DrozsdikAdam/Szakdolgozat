import type { UpdateProbeDto, WorkloadHealthDto } from "../../healthcheck";

export interface ProbeConfigModalProps {
    isOpen: boolean
    onClose: () => void
    workload: WorkloadHealthDto | null
    onSave: (data: UpdateProbeDto) => Promise<void>
    isSaving?: boolean
}