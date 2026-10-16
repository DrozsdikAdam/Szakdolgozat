import { SyncAdapterFactory } from "./sync/sync-adapter.factory.js";
import type {
    ColumnDefinition,
    SyncProgressResult,
    EngineConnectionConfig
} from "./sync/types.js";

export type { ColumnDefinition, SyncProgressResult, EngineConnectionConfig };

export class DataSyncService {
    public normalizeConfig = (engine: string, config?: EngineConnectionConfig): EngineConnectionConfig => {
        const adapter = SyncAdapterFactory.getAdapter(engine);
        return adapter.normalizeConfig(config);
    };

    public disableConstraints = async (targetEngine: string, targetConfig?: EngineConnectionConfig): Promise<void> => {
        const adapter = SyncAdapterFactory.getAdapter(targetEngine);
        const norm = adapter.normalizeConfig(targetConfig);
        await adapter.disableConstraints(norm);
    };

    public enableConstraints = async (targetEngine: string, targetConfig?: EngineConnectionConfig): Promise<void> => {
        const adapter = SyncAdapterFactory.getAdapter(targetEngine);
        const norm = adapter.normalizeConfig(targetConfig);
        await adapter.enableConstraints(norm);
    };

    public discoverSourceTables = async (engine: string, config?: EngineConnectionConfig): Promise<string[]> => {
        const adapter = SyncAdapterFactory.getAdapter(engine);
        const norm = adapter.normalizeConfig(config);
        return await adapter.discoverTables(norm);
    };

    public discoverColumns = async (engine: string, tableName: string, config?: EngineConnectionConfig): Promise<ColumnDefinition[]> => {
        const adapter = SyncAdapterFactory.getAdapter(engine);
        const norm = adapter.normalizeConfig(config);
        return await adapter.discoverColumns(tableName, norm);
    };

    public ensureTargetTableSchema = async (
        targetEngine: string,
        tableName: string,
        columns: ColumnDefinition[],
        targetConfig?: EngineConnectionConfig
    ): Promise<void> => {
        const adapter = SyncAdapterFactory.getAdapter(targetEngine);
        const norm = adapter.normalizeConfig(targetConfig);
        await adapter.ensureTableSchema(tableName, columns, norm);
    };

    public extractTableData = async (engine: string, tableName: string, config?: EngineConnectionConfig): Promise<Record<string, unknown>[]> => {
        const adapter = SyncAdapterFactory.getAdapter(engine);
        const norm = adapter.normalizeConfig(config);
        return await adapter.extractData(tableName, norm);
    };

    public loadTableData = async (
        targetEngine: string,
        tableName: string,
        rows: Record<string, unknown>[],
        columns: ColumnDefinition[],
        targetConfig?: EngineConnectionConfig
    ): Promise<number> => {
        const adapter = SyncAdapterFactory.getAdapter(targetEngine);
        const norm = adapter.normalizeConfig(targetConfig);
        return await adapter.loadData(tableName, rows, columns, norm);
    };

    public syncAllTables = async (
        sourceEngine: string,
        targetEngine: string,
        sourceConfig?: EngineConnectionConfig,
        targetConfig?: EngineConnectionConfig,
        onProgress?: (tableName: string, tablesMigrated: number, totalTables: number, rowsCopied: number) => Promise<void>
    ): Promise<SyncProgressResult> => {
        const sourceAdapter = SyncAdapterFactory.getAdapter(sourceEngine);
        const targetAdapter = SyncAdapterFactory.getAdapter(targetEngine);

        const normSource = sourceAdapter.normalizeConfig(sourceConfig);
        const normTarget = targetAdapter.normalizeConfig(targetConfig);

        const tables = await sourceAdapter.discoverTables(normSource);
        if (tables.length === 0) {
            console.warn(`[DataSyncService] Nem található egyetlen tábla sem a forrás (${sourceEngine}) adatbázisban.`);
            return { totalTables: 0, totalRows: 0 };
        }

        await targetAdapter.disableConstraints(normTarget);

        let totalRowsCopied = 0;
        let tablesMigrated = 0;
        const totalTables = tables.length;

        try {
            for (const tableName of tables) {
                try {
                    let columns = await sourceAdapter.discoverColumns(tableName, normSource);
                    const rows = await sourceAdapter.extractData(tableName, normSource);
                    const firstRow = rows[0];
                    if (columns.length === 0 && firstRow) {
                        columns = Object.keys(firstRow).map(k => {
                            const sampleVal = firstRow[k];
                            const isNum = typeof sampleVal === 'number';
                            const isBool = typeof sampleVal === 'boolean';
                            return {
                                name: k.toLowerCase(),
                                dataType: isNum ? 'numeric' : isBool ? 'boolean' : 'varchar',
                                maxLength: 255,
                                isNullable: true,
                                isIdentity: false
                            };
                        });
                    }

                    if (columns.length > 0) {
                        await targetAdapter.ensureTableSchema(tableName, columns, normTarget);
                    }

                    if (rows.length > 0 && columns.length > 0) {
                        const loaded = await targetAdapter.loadData(tableName, rows, columns, normTarget);
                        totalRowsCopied += loaded;
                    }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.warn(`[DataSyncService] Hiba a(z) '${tableName}' tábla szinkronizációjakor:`, message);
                } finally {
                    tablesMigrated++;
                    if (onProgress) {
                        await onProgress(tableName, tablesMigrated, totalTables, totalRowsCopied);
                    }
                }
            }
        } finally {
            await targetAdapter.enableConstraints(normTarget).catch(() => { });
        }

        return {
            totalTables,
            totalRows: totalRowsCopied
        };
    };
}
