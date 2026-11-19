import { Shield, ShieldAlert } from "lucide-react";
import type { SegmentedControlOption } from "../types/component/common/segmentedControlProps";
import type { SecuritySubTab } from "../types/securityTab";

export const SECURITY_TAB_OPTIONS: SegmentedControlOption<SecuritySubTab>[] = [
    {
        id: "vulnerabilities",
        label: "Sérülékenység-vizsgálat (Trivy)",
        icon: <Shield className="w-3.5 h-3.5" />,
        variant: "teal"
    },
    {
        id: "audit",
        label: "Műveleti Audit Napló",
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
        variant: "purple"
    }
];

export const AUDIT_STATUS_OPTIONS: SegmentedControlOption<"ALL" | "SUCCESS" | "FAILED">[] = [
    { id: "ALL", label: "Összes", variant: "purple" },
    { id: "SUCCESS", label: "Sikeres", variant: "teal" },
    { id: "FAILED", label: "Sikertelen", variant: "vermillon" }
];
