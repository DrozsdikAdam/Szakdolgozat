export interface RateLimitCardProps {
    currentRps: number
    selectRps: number
    onRpsChange: (rps: number) => void
    onSave: () => void
    isLoading: boolean
}