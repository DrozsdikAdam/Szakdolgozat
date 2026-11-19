import type {
    DatabaseEngine,
    DatabaseMode,
    DatabaseStatus,
    MigrationStep,
    CutoverScheduleTime,
    CutoverStatus
} from "../types/database.types.js";

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
