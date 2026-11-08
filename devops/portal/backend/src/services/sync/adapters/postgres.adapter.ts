import pg from "pg";
import { BaseSyncAdapter } from "./base.adapter.js";
import type { EngineConnectionConfig, ColumnDefinition, DatabaseStats, TableForeignKeyDependency } from "../types.js";

interface PgFkRecord {
    child: string;
    parent: string;
}

interface PgTableRecord {
    table_name: string;
}

interface PgColumnRecord {
    column_name: string;
    data_type: string;
    character_maximum_length: number | string | null;
    is_nullable: string;
    column_default: string | null;
}

interface PgStatsRecord {
    total_tables: number | string;
    total_rows: number | string;
}

export class PostgresSyncAdapter extends BaseSyncAdapter {
    readonly engine = 'postgres';

    private async getClient(config: EngineConnectionConfig): Promise<pg.Client> {
        const conf = this.normalizeConfig(config);
        const { host, port } = this.resolveTcpEndpoint(conf, 5432, 30542);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const dbCandidates = Array.from(new Set([conf.database, 'mes_db', 'mesdb', 'postgres'].filter(Boolean)));

        for (const db of dbCandidates) {
            try {
                const client = new pg.Client({
                    host,
                    port,
                    user,
                    password: pass,
                    database: db,
                    connectionTimeoutMillis: 4000
                });
                await client.connect();
                return client;
            } catch { }
        }

        const fallback = new pg.Client({ host, port, user, password: pass, database: 'postgres' });
        await fallback.connect();
        return fallback;
    }

    public async discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]> {
        const client = await this.getClient(config);
        try {
            const sql = `
                SELECT tc.table_name AS child, ccu.table_name AS parent
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
            `;
            const res = await client.query<PgFkRecord>(sql);
            return res.rows.map(r => ({
                childTable: r.child.toLowerCase(),
                parentTable: r.parent.toLowerCase()
            }));
        } catch {
            return [];
        } finally {
            await client.end().catch(() => { });
        }
    }

    public async discoverTables(config: EngineConnectionConfig): Promise<string[]> {
        const client = await this.getClient(config);
        try {
            const sql = `
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT IN ('test_table')
                ORDER BY table_name;
            `;
            const res = await client.query<PgTableRecord>(sql);
            const tables = res.rows.map(r => r.table_name.toLowerCase());
            return await this.sortTablesByDependency(tables, config);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[PostgresSyncAdapter] Tábla-felfedezés hiba:', message);
            return [];
        } finally {
            await client.end().catch(() => { });
        }
    }

    public async discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]> {
        const client = await this.getClient(config);
        try {
            const sql = `
                SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1;
            `;
            const res = await client.query<PgColumnRecord>(sql, [tableName.toLowerCase()]);
            return res.rows.map(r => ({
                name: r.column_name.toLowerCase(),
                dataType: r.data_type.toLowerCase(),
                maxLength: r.character_maximum_length ? Number(r.character_maximum_length) : null,
                isNullable: r.is_nullable === 'YES',
                isIdentity: Boolean(r.column_default && r.column_default.includes('nextval'))
            }));
        } catch {
            return [];
        } finally {
            await client.end().catch(() => { });
        }
    }

    private mapPgType(c: ColumnDefinition): string {
        const dt = c.dataType.toLowerCase();
        if (dt.includes('uuid')) return 'UUID';
        if (dt.includes('int') || dt.includes('serial')) return 'BIGINT';
        if (dt.includes('bool') || dt.includes('bit')) return 'BOOLEAN';
        if (dt.includes('date') || dt.includes('time')) return 'TIMESTAMP';
        if (dt.includes('decimal') || dt.includes('numeric') || dt.includes('float') || dt.includes('real')) return 'NUMERIC(19,4)';
        if (c.maxLength && c.maxLength > 0 && c.maxLength < 1000) return `VARCHAR(${c.maxLength})`;
        return 'TEXT';
    }

    public async ensureTableSchema(tableName: string, columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<void> {
        if (!columns || columns.length === 0) return;
        const client = await this.getClient(config);
        const cleanTable = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '');

        try {
            const colDefs = columns.map(c => `"${c.name.toLowerCase()}" ${this.mapPgType(c)}`).join(', ');
            await client.query(`CREATE TABLE IF NOT EXISTS "${cleanTable}" (${colDefs});`);

            for (const c of columns) {
                const alterSql = `ALTER TABLE "${cleanTable}" ADD COLUMN IF NOT EXISTS "${c.name.toLowerCase()}" ${this.mapPgType(c)};`;
                await client.query(alterSql).catch(() => { });
            }
        } finally {
            await client.end().catch(() => { });
        }
    }

    public async extractData(tableName: string, config: EngineConnectionConfig): Promise<Record<string, unknown>[]> {
        const client = await this.getClient(config);
        try {
            const cleanTable = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '');
            const res = await client.query<Record<string, unknown>>(`SELECT * FROM "${cleanTable}";`);
            return this.normalizeExtractedRows(res.rows);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[PostgresSyncAdapter] Extract hiba (${tableName}):`, message);
            return [];
        } finally {
            await client.end().catch(() => { });
        }
    }

    private normalizeParamValue(val: unknown): unknown {
        if (val === null || val === undefined) return null;
        if (Buffer.isBuffer(val)) {
            if (val.length === 16) {
                const hex = val.toString('hex');
                return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`.toLowerCase();
            }
            return val.toString('utf8');
        }
        if (typeof val === 'string' && /^[0-9a-fA-F]{32}$/.test(val)) {
            return `${val.slice(0, 8)}-${val.slice(8, 12)}-${val.slice(12, 16)}-${val.slice(16, 20)}-${val.slice(20, 32)}`.toLowerCase();
        }
        return val;
    }

    public async loadData(tableName: string, rows: Record<string, unknown>[], columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<number> {
        const firstRow = rows[0];
        if (!firstRow) return 0;
        const client = await this.getClient(config);
        const cleanTable = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '');

        try {
            await client.query("SET session_replication_role = 'replica';");
            await client.query(`DELETE FROM "${cleanTable}";`);

            const rowKeys = Object.keys(firstRow).map(k => k.toLowerCase());
            const colNames = rowKeys.map(c => `"${c}"`).join(', ');
            const batchSize = 100;

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const valueClauses: string[] = [];
                const params: unknown[] = [];
                let paramIndex = 1;

                for (const row of batch) {
                    const rowPlaceholders: string[] = [];
                    for (const c of rowKeys) {
                        rowPlaceholders.push(`$${paramIndex++}`);
                        params.push(this.normalizeParamValue(row[c]));
                    }
                    valueClauses.push(`(${rowPlaceholders.join(', ')})`);
                }

                const insertSql = `INSERT INTO "${cleanTable}" (${colNames}) VALUES ${valueClauses.join(', ')};`;
                await client.query(insertSql, params);
            }

            await client.query("SET session_replication_role = 'origin';").catch(() => { });
            return rows.length;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[PostgresSyncAdapter] Betöltési hiba (${cleanTable}):`, message);
            return 0;
        } finally {
            await client.end().catch(() => { });
        }
    }

    public async disableConstraints(config: EngineConnectionConfig): Promise<void> {
        const client = await this.getClient(config);
        try {
            await client.query("SET session_replication_role = 'replica';");
        } catch { }
        finally {
            await client.end().catch(() => { });
        }
    }

    public async enableConstraints(config: EngineConnectionConfig): Promise<void> {
        const client = await this.getClient(config);
        try {
            await client.query("SET session_replication_role = 'origin';");
        } catch { }
        finally {
            await client.end().catch(() => { });
        }
    }

    public async getStats(config: EngineConnectionConfig): Promise<DatabaseStats> {
        const client = await this.getClient(config);
        try {
            const sql = `
                SELECT
                    (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT IN ('test_table')) AS total_tables,
                    COALESCE((
                        SELECT sum(c) FROM (
                            SELECT (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS c
                            FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT IN ('test_table')
                        ) t
                    ), 0)::bigint AS total_rows;
            `;
            const res = await client.query<PgStatsRecord>(sql);
            const totalTables = Number(res.rows[0]?.total_tables) || 0;
            const totalRows = Number(res.rows[0]?.total_rows) || 0;
            return { totalTables, totalRows };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[PostgresSyncAdapter] Statisztika hiba:', message);
            return { totalTables: 0, totalRows: 0 };
        } finally {
            await client.end().catch(() => { });
        }
    }
}
