export interface RateLimitCardProps {
    currentRps: number
    selectRps: number
    onRpsChange: (rps: number) => void
    currentBurst: number
    selectBurst: number
    onBurstChange: (burst: number) => void
    onSave: () => void
    isLoading: boolean
}