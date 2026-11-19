import { Archive, ArrowRightLeft, Database, HardDrive } from "lucide-react";
import type { SegmentedControlOption } from "../types/component/common/segmentedControlProps";
import type { DatabaseSubTab } from "../types/databaseTab";

export const DATABASE_TAB_OPTIONS: SegmentedControlOption<DatabaseSubTab>[] = [
    {
        id: "engines",
        label: "Adatbázis Motorok (DBaaS)",
        icon: <Database className="w-3.5 h-3.5" />,
        variant: "teal"
    },
    {
        id: "migration",
        label: "Zero-Downtime Migráció",
        icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
        variant: "teal"
    },
    {
        id: "backups",
        label: "Mentések (S3 Backup)",
        icon: <Archive className="w-3.5 h-3.5" />,
        variant: "teal"
    },
    {
        id: "storage",
        label: "Objektum Tárhely (S3)",
        icon: <HardDrive className="w-3.5 h-3.5" />,
        variant: "teal"
    }
];
