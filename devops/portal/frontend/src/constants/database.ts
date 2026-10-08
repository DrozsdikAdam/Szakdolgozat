import type { DatabaseEngine, DatabaseMode, DatabaseFormData, DatabaseStatus, MigrationStep } from "../types/database";
import type { PresetItem } from "../types/component/common/presetGroupProps";
import type { BadgeProps } from "../types/component/badgeProps";

export const DEFAULT_DB_PORTS: Record<DatabaseEngine, number> = {
    postgres: 5432,
    mssql: 1433,
    oracle: 1521
};

export const DEFAULT_INTERNAL_HOSTS: Record<DatabaseEngine, string> = {
    postgres: "postgres-postgresql-ha-postgresql.platform-infra.svc.cluster.local",
    mssql: "mssql.platform-infra.svc.cluster.local",
    oracle: "oracle.platform-infra.svc.cluster.local"
};

export const DEFAULT_INTERNAL_CONFIGS: Record<DatabaseEngine, { host: string; port: number; database: string; username: string; password: string }> = {
    postgres: {
        host: "postgres-postgresql-ha-postgresql.platform-infra.svc.cluster.local",
        port: 5432,
        database: "mes_db",
        username: "postgres",
        password: "VnUH22Refo"
    },
    mssql: {
        host: "mssql.platform-infra.svc.cluster.local",
        port: 1433,
        database: "mesdb",
        username: "sa",
        password: "MesStrongPass123!"
    },
    oracle: {
        host: "oracle.platform-infra.svc.cluster.local",
        port: 1521,
        database: "FREEPDB1",
        username: "mesuser",
        password: "mespassword"
    }
};

export const INITIAL_DATABASE_FORM: DatabaseFormData = {
    engine: "postgres",
    mode: "internal",
    host: "postgres-postgresql-ha-postgresql.platform-infra.svc.cluster.local",
    port: 5432,
    database: "mes_db",
    username: "postgres",
    password: "VnUH22Refo",
    replicas: 1,
    poolSize: 20,
    restartWorkload: true
};

export const DB_ENGINE_OPTIONS: PresetItem<DatabaseEngine>[] = [
    {
        id: "postgres",
        label: "PostgreSQL",
        description: "PostgreSQL 16 Patroni HA klaszter automatikus feladatátvétellel és PgBouncerrel (5432).",
        badge: "Ajánlott",
        value: "postgres",
    },
    {
        id: "mssql",
        label: "Microsoft SQL Server",
        description: "MS SQL Server 2022 Developer konténer T-SQL támogatással a platform-infra névtérben (1433).",
        badge: "MS SQL 2022",
        value: "mssql",
    },
    {
        id: "oracle",
        label: "Oracle Database",
        description: "Oracle Database Free 23c Enterprise konténer PL/SQL támogatással a platform-infra névtérben (1521).",
        badge: "Oracle 23c",
        value: "oracle",
    },
];

export const DB_MODE_OPTIONS: PresetItem<DatabaseMode>[] = [
    {
        id: "internal",
        label: "Belső K8s Klaszter",
        description: "A Kubernetes automatikusan elindítja és felügyeli a kiválasztott adatbázis konténert.",
        badge: "Managed",
        value: "internal",
    },
    {
        id: "external",
        label: "Külső / Felhő Adatbázis",
        description: "Már meglévő külső adatbázishoz (AWS RDS, Azure SQL, GCP Cloud SQL, Oracle Cloud) kapcsolódik.",
        badge: "Cloud / On-prem",
        value: "external",
    },
];

export const DATABASE_STATUS_BADGES: Record<DatabaseStatus, BadgeProps> = {
    ONLINE: { text: "Online", variant: "teal", pulse: true },
    DEGRADED: { text: "Degradált", variant: "orange", pulse: true },
    OFFLINE: { text: "Offline", variant: "vermillon", pulse: false }
};

export const MIGRATION_STEP_LABELS: Record<MigrationStep, string> = {
    PENDING: "Várakozás",
    SNAPSHOT: "Pillanatkép készítése",
    SCHEMA_INIT: "Séma inicializálása (DDL)",
    DATA_COPY: "Adatok másolása (CDC)",
    VALIDATING: "Konzisztencia ellenőrzése",
    COMPLETED: "Migráció befejezve",
    FAILED: "Migrációs hiba"
};
