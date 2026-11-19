import type { KillPodRequestDto, KillPodResult } from "../../resilience"

export interface ChaosEngineeringCardProps {
    isKillingPod: boolean
    activeExperimentId: string | null
    chaosTimerSeconds: number
    onTriggerPodKill: (request: KillPodRequestDto) => Promise<void>
    recentExperiments?: KillPodResult[] | undefined
}