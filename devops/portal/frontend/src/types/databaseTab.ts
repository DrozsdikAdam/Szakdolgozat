export type DatabaseSubTab = "engines" | "migration" | "backups" | "storage";

export interface DatabaseTabProps {
    initialTab?: DatabaseSubTab;
}
