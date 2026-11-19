import { Activity, Box, Terminal } from "lucide-react";
import type { SegmentedControlOption } from "../types/component/common/segmentedControlProps";
import type { SelectOption } from "../types/component/common/selectProps";
import type { ClusterViewMode } from "../types/cluster";

export const LOG_TAIL_OPTIONS: SelectOption<number>[] = [
    { value: 50, label: "50 sor" },
    { value: 150, label: "150 sor" },
    { value: 300, label: "300 sor" },
    { value: 500, label: "500 sor" }
];

export const createClusterViewOptions = (podsCount: number, eventsCount: number): SegmentedControlOption<ClusterViewMode>[] => [
    {
        id: "pods",
        label: "Podok & Erőforrások",
        count: podsCount,
        icon: <Box className="w-3.5 h-3.5" />,
        variant: "skyblue"
    },
    {
        id: "events",
        label: "Klaszter Események",
        count: eventsCount,
        icon: <Activity className="w-3.5 h-3.5" />,
        variant: "skyblue"
    },
    {
        id: "logs",
        label: "Élő Konténer Naplók",
        icon: <Terminal className="w-3.5 h-3.5" />,
        variant: "skyblue"
    }
];

export const createPodSourceOptions = (totalCount: number, appCount: number, platformCount: number): SegmentedControlOption<"all" | "app" | "platform">[] => [
    { id: "all", label: "Összes", count: totalCount, variant: "skyblue" },
    { id: "app", label: "App Podok", count: appCount, variant: "skyblue" },
    { id: "platform", label: "Platform", count: platformCount, variant: "skyblue" }
];
