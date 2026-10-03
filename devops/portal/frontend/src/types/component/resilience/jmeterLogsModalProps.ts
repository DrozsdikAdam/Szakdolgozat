import type { LoadTestDetailDto } from "../../resilience"

export interface JMeterLogsModalProps {
    isOpen: boolean
    job: LoadTestDetailDto | null
    isLoadingLogs: boolean
    onClose: () => void
}