export type ConfigsSubTab = "features" | "config" | "wizard";

export interface ConfigsTabProps {
    initialTab?: ConfigsSubTab;
    onNavigate?: (serviceId: any) => void;
}
