import type { DatabaseEngine, DatabaseMode } from "../types/setup.types.js";
import type { DatabaseOverviewDto } from "../dtos/database.dto.js";

export const DEFAULT_DB_PORTS: Record<DatabaseEngine, number> = {
    postgres: 5432,
    mssql: 1433,
    oracle: 1521
};

export const DEFAULT_INTERNAL_HOSTS: Record<DatabaseEngine, string> = {
    postgres: 'postgres-postgresql-primary.platform-infra.svc.cluster.local',
    mssql: 'mssql.platform-infra.svc.cluster.local',
    oracle: 'oracle.platform-infra.svc.cluster.local'
};

export const DEFAULT_INTERNAL_CREDENTIALS: Record<DatabaseEngine, { database: string; username: string; password: string }> = {
    postgres: {
        database: 'mes_db',
        username: 'postgres',
        password: 'VnUH22Refo'
    },
    mssql: {
        database: 'mesdb',
        username: 'sa',
        password: 'MesStrongPass123!'
    },
    oracle: {
        database: 'FREEPDB1',
        username: 'mesuser',
        password: 'mespassword'
    }
};

export const DATABASE_LIMITS = {
    MIN_REPLICAS: 0,
    MAX_REPLICAS: 5,
    DEFAULT_REPLICAS: 2,
    DEFAULT_POOL_SIZE: 50,
    SOCKET_TIMEOUT_MS: 4000
} as const;

import { DEFAULT_APP_NAMESPACE, DEFAULT_PLATFORM_NAMESPACE, DEFAULT_APP_NAME } from './namespace.constants.js';

export const DATABASE_DEFAULTS = {
    ENGINE: 'postgres' as DatabaseEngine,
    MODE: 'internal' as DatabaseMode,
    DB_NAME: 'mes_db',
    DB_USER: 'mes_user',
    APP_NAMESPACE: DEFAULT_APP_NAMESPACE,
    INFRA_NAMESPACE: DEFAULT_PLATFORM_NAMESPACE,
    SECRET_NAME: 'backend-secret',
    POSTGRES_STATEFULSET: 'postgres-postgresql-ha-postgresql',
    PGBOUNCER_DEPLOYMENT: 'pgbouncer',
    BACKEND_DEPLOYMENT: DEFAULT_APP_NAME
} as const;

export const MIGRATION_CONSTANTS = {
    TOTAL_TABLES: 14,
    SAMPLE_ROWS: 12480,
    INITIAL_PROGRESS: 5,
    SNAPSHOT_PROGRESS: 20,
    SCHEMA_PROGRESS: 45,
    DATA_STAGE1_PROGRESS: 65,
    DATA_STAGE2_PROGRESS: 85,
    VALIDATING_PROGRESS: 95,
    COMPLETED_PROGRESS: 100
} as const;

export const FALLBACK_DATABASE_OVERVIEW: DatabaseOverviewDto = {
    engine: 'postgres',
    mode: 'internal',
    host: 'pgbouncer.platform-infra.svc.cluster.local',
    port: 5432,
    database: 'mes_db',
    username: 'mes_user',
    replicas: 2,
    maxReplicas: 5,
    activeConnections: 5,
    poolSize: 50,
    latencyMs: 2,
    status: 'ONLINE',
    serverVersion: 'PostgreSQL 15 HA',
    pgbouncerEnabled: true,
    multiDbEnabled: true
};
