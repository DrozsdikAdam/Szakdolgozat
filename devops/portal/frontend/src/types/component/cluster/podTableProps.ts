import type { PodInfo } from "../../k8s"

export interface PodTableItem extends PodInfo {
    source: "app" | "platform"
}

export interface PodTableProps {
    pods: PodTableItem[]
    loading: boolean
    searchQuery: string
    onViewLogs?: (pod: PodTableItem) => void
}
