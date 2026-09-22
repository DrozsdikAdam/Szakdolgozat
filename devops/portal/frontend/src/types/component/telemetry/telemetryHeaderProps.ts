import type { TelemetrySourceStatus, TelemetryTimeRange } from "../../telemetry";

export interface TelemetryHeaderProps {
    sources: Record<string, TelemetrySourceStatus>
    selectedRange: TelemetryTimeRange
    onRangeChange: (range: TelemetryTimeRange) => void
    onRefresh: () => void
    isLoading?: boolean
}
