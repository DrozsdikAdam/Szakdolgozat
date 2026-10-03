import type { KillPodResult, LoadTestItem } from "../../resilience"

export interface LoadTestTableProps {
    tests: LoadTestItem[]
    isLoading?: boolean | undefined
    onViewLogs: (jobName: string) => void
}

export interface ChaosHistoryTableProps {
    experiments: KillPodResult[]
    isLoading?: boolean | undefined
}