import { Activity, Cpu, Sliders } from "lucide-react";
import type { SegmentedControlOption } from "../types/component/common/segmentedControlProps";
import type { TrafficSubTab } from "../types/traffic";

export const TRAFFIC_TAB_OPTIONS: SegmentedControlOption<TrafficSubTab>[] = [
    {
        id: "ingress",
        label: "Ingress Szabályozás (RPS)",
        icon: <Activity className="w-3.5 h-3.5" />,
        variant: "skyblue"
    },
    {
        id: "hpa",
        label: "Horizontális Skálázás (HPA)",
        icon: <Cpu className="w-3.5 h-3.5" />,
        variant: "skyblue"
    },
    {
        id: "vpa",
        label: "Erőforráskeretek (VPA)",
        icon: <Sliders className="w-3.5 h-3.5" />,
        variant: "skyblue"
    }
];
