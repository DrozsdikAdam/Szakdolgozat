import type { DatabaseEngine, DatabaseMode } from "./platform";

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

export interface DatabaseFormData {
    engine: DatabaseEngine;
    mode: DatabaseMode;
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string | undefined;
    replicas: number;
    poolSize: number;
    restartWorkload: boolean;
}

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

export interface DatabaseOverviewDto {
    engine: DatabaseEngine;
    mode: DatabaseMode;
    host: string;
    port: number;
    database: string;
    username: string;
    replicas: number;
    maxReplicas: number;
    activeConnections: number;
    poolSize: number;
    latencyMs: number;
    status: DatabaseStatus;
    serverVersion?: string | undefined;
    pgbouncerEnabled: boolean;
    multiDbEnabled: boolean;
}

export interface ScaleDatabaseDto {
    engine: DatabaseEngine;
    replicas: number;
    poolSize?: number | undefined;
}

export interface TestConnectionDto {
    engine: DatabaseEngine;
    mode: DatabaseMode;
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string | undefined;
}

export interface TestConnectionResultDto {
    success: boolean;
    latencyMs: number;
    serverVersion?: string | undefined;
    message: string;
}

export interface SaveDatabaseConfigDto {
    engine: DatabaseEngine;
    mode: DatabaseMode;
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string | undefined;
    replicas?: number | undefined;
    poolSize?: number | undefined;
    restartWorkload?: boolean | undefined;
}

export interface StartMigrationDto {
    sourceEngine: DatabaseEngine;
    targetEngine: DatabaseEngine;
    targetConfig: TestConnectionDto;
}

export interface MigrationJobStatusDto {
    jobId: string;
    status: MigrationStep;
    progressPercent: number;
    currentStep: string;
    tablesTotal: number;
    tablesMigrated: number;
    rowsCopied: number;
    sourceEngine: DatabaseEngine;
    targetEngine: DatabaseEngine;
    startedAt: string;
    completedAt?: string | undefined;
    errorMessage?: string | undefined;
}

export interface ScheduleCutoverDto {
    jobId?: string | undefined;
    targetEngine: DatabaseEngine;
    targetConfig: TestConnectionDto;
    scheduledAt: CutoverScheduleTime;
    enableMaintenanceMode: boolean;
    restartBackend: boolean;
}

export interface CutoverStatusDto {
    scheduledAt?: string | undefined;
    status: CutoverStatus;
    targetEngine?: DatabaseEngine | undefined;
    scheduledJobId?: string | undefined;
    lastExecutedAt?: string | undefined;
    maintenanceModeActive?: boolean | undefined;
    message?: string | undefined;
}

