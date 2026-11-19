import { PostgresSyncAdapter } from "./adapters/postgres.adapter.js";
import { MssqlSyncAdapter } from "./adapters/mssql.adapter.js";
import { OracleSyncAdapter } from "./adapters/oracle.adapter.js";
import type { DatabaseSyncAdapter } from "./types.js";

export class SyncAdapterFactory {
    private static adapters: Map<string, DatabaseSyncAdapter> = new Map<string, DatabaseSyncAdapter>([
        ['postgres', new PostgresSyncAdapter()],
        ['mssql', new MssqlSyncAdapter()],
        ['oracle', new OracleSyncAdapter()]
    ]);

    public static getAdapter(engine: string): DatabaseSyncAdapter {
        if (!engine) {
            throw new Error("Adatbázis motor megadása kötelező a szinkronizációs adapter kiválasztásához.");
        }

        const normalized = engine.toLowerCase().trim();
        const adapter = this.adapters.get(normalized);
        if (!adapter) {
            throw new Error(`Nem támogatott adatbázis motor a szinkronizációhoz: '${engine}'. Támogatott motorok: postgres, mssql, oracle.`);
        }

        return adapter;
    }
}
