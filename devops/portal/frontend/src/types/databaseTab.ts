export type DatabaseSubTab = "engines" | "migration" | "backups";

export interface DatabaseTabProps {
    initialTab?: DatabaseSubTab;
}
