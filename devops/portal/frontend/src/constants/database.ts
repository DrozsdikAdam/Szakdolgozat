import type { DatabaseEngine, DatabaseMode, DatabaseFormData, DatabaseStatus, MigrationStep } from "../types/database";
import type { PresetItem } from "../types/component/common/presetGroupProps";
import type { BadgeProps } from "../types/component/badgeProps";
import type { SliderMark } from "../types/component/common/sliderProps";

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

export const DATABASE_POOL_LIMITS = {
    MIN_SIZE: 10,
    MAX_SIZE: 100,
    STEP: 5,
    DEFAULT_SIZE: 20
} as const;

export const DEFAULT_POOL_MARKS: SliderMark[] = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 50, label: "50" },
    { value: 100, label: "100" }
];

export const DATABASE_REPLICA_LIMITS = {
    MIN_REPLICAS: 1,
    MAX_REPLICAS: 5,
    STEP: 1,
    DEFAULT_REPLICAS: 1
} as const;

export const DEFAULT_REPLICA_MARKS: SliderMark[] = [
    { value: 1, label: "1 db" },
    { value: 2, label: "2 db" },
    { value: 3, label: "3 db" },
    { value: 4, label: "4 db" },
    { value: 5, label: "5 db" }
];

export const getReplicaMarks = (maxReplicas: number = DATABASE_REPLICA_LIMITS.MAX_REPLICAS): SliderMark[] =>
    Array.from({ length: maxReplicas }, (_, i) => ({
        value: i + 1,
        label: `${i + 1} db`
    }));

export const HA_REPLICA_DESCRIPTIONS: Record<number, string> = {
    1: "Egypéldányos alap fejlesztői vagy teszt felállás (Standalone).",
    2: "Magas rendelkezésre állás (HA) automatikus failoverrel (1 Leader + 1 Standby).",
    3: "Optimális termelési HA klaszter quorum konszenzussal (1 Leader + 2 Standby)."
};

export const DEFAULT_HA_REPLICA_DESCRIPTION = "Nagy teljesítményű olvasási fürt horizontálisan terheléselosztva.";
