import type { StartLoadTestDto } from "../../resilience"

export interface JMeterLoadTestCardProps {
    isStartingLoadTest: boolean
    onStartLoadTest: (request: StartLoadTestDto) => Promise<void>
}