import { SyncAdapterFactory } from "./sync/sync-adapter.factory.js";
import type {
    ColumnDefinition,
    SyncProgressResult,
    EngineConnectionConfig,
    DatabaseSyncAdapter
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

    public extractTableData = async (engine: string, tableName: string, config?: EngineConnectionConfig): Promise<any[]> => {
        const adapter = SyncAdapterFactory.getAdapter(engine);
        const norm = adapter.normalizeConfig(config);
        return await adapter.extractData(tableName, norm);
    };

    public loadTableData = async (
        targetEngine: string,
        tableName: string,
        rows: any[],
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
                    const rows = await sourceAdapter.extractData(tableName, normSource);
                    if (rows.length === 0) {
                        continue;
                    }

                    let columns = await sourceAdapter.discoverColumns(tableName, normSource);
                    if (columns.length === 0) {
                        columns = Object.keys(rows[0]).map(k => ({
                            name: k.toLowerCase(),
                            dataType: typeof rows[0][k] === 'number' ? 'numeric' : typeof rows[0][k] === 'boolean' ? 'boolean' : 'varchar',
                            maxLength: 255,
                            isNullable: true,
                            isIdentity: false
                        }));
                    }

                    await targetAdapter.ensureTableSchema(tableName, columns, normTarget);
                    const loaded = await targetAdapter.loadData(tableName, rows, columns, normTarget);
                    totalRowsCopied += loaded;
                } catch (err) {
                    console.warn(`[DataSyncService] Hiba a(z) '${tableName}' tábla szinkronizációjakor:`, (err as any)?.message || err);
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
