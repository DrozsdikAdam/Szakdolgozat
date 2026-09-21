import type { GoldenSignalsDto } from "../../telemetry";

export interface GoldenSignalsPanelProps {
    signals: GoldenSignalsDto
    isLoading?: boolean
}