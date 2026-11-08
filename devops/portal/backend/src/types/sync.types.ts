export interface ColumnDefinition {
    name: string;
    dataType: string;
    maxLength?: number | null;
    isNullable: boolean;
    isIdentity: boolean;
}

export interface SyncProgressResult {
    totalTables: number;
    totalRows: number;
}

export interface DatabaseStats {
    totalTables: number;
    totalRows: number;
}

export interface EngineConnectionConfig {
    host?: string | undefined;
    port?: number | undefined;
    database?: string | undefined;
    username?: string | undefined;
    password?: string | undefined;
    mode?: string | undefined;
}

export interface TableForeignKeyDependency {
    childTable: string;
    parentTable: string;
}

export interface DatabaseSyncAdapter {
    readonly engine: string;
    normalizeConfig(config?: EngineConnectionConfig): EngineConnectionConfig;
    discoverTables(config: EngineConnectionConfig): Promise<string[]>;
    discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]>;
    discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]>;
    ensureTableSchema(tableName: string, columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<void>;
    extractData(tableName: string, config: EngineConnectionConfig): Promise<Record<string, unknown>[]>;
    loadData(tableName: string, rows: Record<string, unknown>[], columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<number>;
    disableConstraints(config: EngineConnectionConfig): Promise<void>;
    enableConstraints(config: EngineConnectionConfig): Promise<void>;
    getStats(config: EngineConnectionConfig): Promise<DatabaseStats>;
}
