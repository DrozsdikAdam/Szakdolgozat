export type TrafficSubTab = "ingress" | "hpa" | "vpa";

export interface TrafficTabProps {
    initialTab?: TrafficSubTab;
}
