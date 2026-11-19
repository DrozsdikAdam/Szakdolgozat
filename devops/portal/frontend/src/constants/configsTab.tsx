import { FileText, Sliders, Wand2 } from "lucide-react";
import type { SegmentedControlOption } from "../types/component/common/segmentedControlProps";
import type { ConfigsSubTab } from "../types/configsTab";

export const CONFIGS_TAB_OPTIONS: SegmentedControlOption<ConfigsSubTab>[] = [
    {
        id: "features",
        label: "Funkciókapcsolók (Feature Flags)",
        icon: <Sliders className="w-3.5 h-3.5" />,
        variant: "purple"
    },
    {
        id: "config",
        label: "Klaszter Konfigurációk & Titkok",
        icon: <FileText className="w-3.5 h-3.5" />,
        variant: "purple"
    },
    {
        id: "wizard",
        label: "Rendszer Varázsló (Setup Wizard)",
        icon: <Wand2 className="w-3.5 h-3.5" />,
        variant: "purple"
    }
];
