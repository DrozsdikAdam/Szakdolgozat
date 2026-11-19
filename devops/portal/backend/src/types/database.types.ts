import type { DatabaseEngine, DatabaseMode } from "./setup.types.js";

export type { DatabaseEngine, DatabaseMode };

export type DatabaseStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export type MigrationStep =
    | 'PENDING'
    | 'SNAPSHOT'
    | 'SCHEMA_INIT'
    | 'DATA_COPY'
    | 'VALIDATING'
    | 'COMPLETED'
    | 'FAILED';

export type CutoverScheduleTime = string | 'immediate';

export type CutoverStatus =
    | 'IDLE'
    | 'SCHEDULED'
    | 'SWITCHING'
    | 'COMPLETED'
    | 'CANCELLED';

export interface ParsedDatabaseConfig {
    engine: DatabaseEngine;
    mode: DatabaseMode;
    host: string;
    port: number;
    database: string;
    username: string;
    poolSize: number;
    savedReplicas: number;
}

export interface ScaleDatabaseResult {
    success: boolean;
    replicas: number;
    message: string;
}

export interface SaveDatabaseConfigResult {
    success: boolean;
    message: string;
}

export interface ToOverviewDtoParams {
    config: ParsedDatabaseConfig;
    replicas: number;
    pingResult: {
        success: boolean;
        latencyMs: number;
        serverVersion?: string | undefined;
        message: string;
    };
}
