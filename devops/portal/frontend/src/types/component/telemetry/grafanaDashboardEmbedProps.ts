import type { GrafanaDashboardDto } from "../../telemetry";

export interface GrafanaDashboardEmbedProps {
    dashboards: GrafanaDashboardDto[]
    activeDashboardId?: string
    onSelectDashboard: (id: string) => void
}