import type { MachineResponse } from "../machine/Machine"

export interface AnalyticsFilterBarProps {
    machines: MachineResponse[]
    selectedMachineId: string
    onSelectMachine: (id: string) => void
    isLive: boolean
    onToggleLive: () => void
    timeRange: "1h" | "24h" | "7d"
    onChangeTimeRange: (range: "1h" | "24h" | "7d") => void
    onRefresh: () => void
    isLoading: boolean
}