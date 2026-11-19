import type { DatabaseEngine, MigrationJobStatusDto } from "../../database";

export interface MigrationStepperCardProps {
    currentEngine: DatabaseEngine;
    isMigrating: boolean;
    activeJob: MigrationJobStatusDto | null;
    onStartMigration: (targetEngine: DatabaseEngine) => void;
    onOpenCutoverModal: () => void;
    hasActiveCutoverSchedule?: boolean | undefined;
    disabled?: boolean | undefined;
}
