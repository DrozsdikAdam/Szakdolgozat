import sql from "mssql";
import { BaseSyncAdapter } from "./base.adapter.js";
import type { EngineConnectionConfig, ColumnDefinition, DatabaseStats, TableForeignKeyDependency } from "../types.js";

interface MsFkRecord {
    parentTable: string;
    childTable: string;
}

interface MsTableRecord {
    TABLE_NAME: string;
}

interface MsColumnRecord {
    name: string;
    dataType: string;
    maxLength: number | null;
    isNullable: string;
    isIdentity: number;
}

interface MsStatsRecord {
    total_tables: number;
    total_rows: number;
}

export class MssqlSyncAdapter extends BaseSyncAdapter {
    readonly engine = 'mssql';

    private async getPool(config: EngineConnectionConfig): Promise<sql.ConnectionPool> {
        const conf = this.normalizeConfig(config);
        const { host, port } = this.resolveTcpEndpoint(conf, 1433, 31433);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = conf.database || 'mesdb';

        const pool = new sql.ConnectionPool({
            user,
            password: pass,
            server: host,
            port,
            database: db,
            connectionTimeout: 5000,
            requestTimeout: 60000,
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        });
        return await pool.connect();
    }

    public async discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]> {
        const pool = await this.getPool(config);
        try {
            const query = `
                SELECT
                    tp.name AS parentTable,
                    tr.name AS childTable
                FROM sys.foreign_keys fk
                JOIN sys.tables tp ON fk.referenced_object_id = tp.object_id
                JOIN sys.tables tr ON fk.parent_object_id = tr.object_id;
            `;
            const result = await pool.request().query<MsFkRecord>(query);
            return result.recordset.map(r => ({
                childTable: r.childTable.toLowerCase(),
                parentTable: r.parentTable.toLowerCase()
            }));
        } catch {
            return [];
        } finally {
            await pool.close().catch(() => { });
        }
    }

    public async discoverTables(config: EngineConnectionConfig): Promise<string[]> {
        const pool = await this.getPool(config);
        try {
            const query = `
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN ('sysdiagrams')
                ORDER BY TABLE_NAME;
            `;
            const result = await pool.request().query<MsTableRecord>(query);
            const tables = result.recordset.map(r => r.TABLE_NAME.toLowerCase());
            return await this.sortTablesByDependency(tables, config);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[MssqlSyncAdapter] Tábla-felfedezés hiba:', message);
            return [];
        } finally {
            await pool.close().catch(() => { });
        }
    }

    public async discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]> {
        const pool = await this.getPool(config);
        try {
            const query = `
                SELECT
                    COLUMN_NAME as name,
                    DATA_TYPE as dataType,
                    CHARACTER_MAXIMUM_LENGTH as maxLength,
                    IS_NULLABLE as isNullable,
                    COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') as isIdentity
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = @tableName;
            `;
            const result = await pool.request()
                .input('tableName', sql.NVarChar, tableName)
                .query<MsColumnRecord>(query);
            return result.recordset.map(r => ({
                name: r.name.toLowerCase(),
                dataType: r.dataType.toLowerCase(),
                maxLength: r.maxLength ? Number(r.maxLength) : null,
                isNullable: r.isNullable === 'YES',
                isIdentity: r.isIdentity === 1
            }));
        } catch {
            return [];
        } finally {
            await pool.close().catch(() => { });
        }
    }

    private mapMsType(c: ColumnDefinition): string {
        const dt = c.dataType.toLowerCase();
        if (dt.includes('uuid') || dt.includes('uniqueidentifier') || (c.maxLength && c.maxLength === 36)) return 'VARCHAR(36)';
        if (dt.includes('int') || dt.includes('smallint')) return 'BIGINT';
        if (dt.includes('bool') || dt.includes('bit')) return 'BIT';
        if (dt.includes('date') || dt.includes('time')) return 'DATETIME2';
        if (dt.includes('decimal') || dt.includes('numeric') || dt.includes('float') || dt.includes('real')) return 'DECIMAL(19,4)';
        if (c.maxLength && c.maxLength > 0 && c.maxLength < 1000) return `NVARCHAR(${c.maxLength})`;
        return 'NVARCHAR(MAX)';
    }

    public async ensureTableSchema(tableName: string, columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<void> {
        if (!columns || columns.length === 0) return;
        const pool = await this.getPool(config);
        try {
            const colDefs = columns.map(c => `[${c.name.toLowerCase()}] ${this.mapMsType(c)}`).join(', ');
            let fullMssql = `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${tableName}') CREATE TABLE [${tableName}] (${colDefs});\n`;
            for (const c of columns) {
                fullMssql += `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${tableName}]') AND name = '${c.name.toLowerCase()}') ALTER TABLE [${tableName}] ADD [${c.name.toLowerCase()}] ${this.mapMsType(c)} NULL;\n`;
            }
            await pool.request().query(fullMssql);
        } finally {
            await pool.close().catch(() => { });
        }
    }

    public async extractData(tableName: string, config: EngineConnectionConfig): Promise<Record<string, unknown>[]> {
        const pool = await this.getPool(config);
        try {
            const result = await pool.request().query<Record<string, unknown>>(`SELECT * FROM [${tableName}];`);
            return this.normalizeExtractedRows(result.recordset);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[MssqlSyncAdapter] Extract hiba (${tableName}):`, message);
            return [];
        } finally {
            await pool.close().catch(() => { });
        }
    }

    private normalizeParamValue(val: unknown): unknown {
        if (val === null || val === undefined) return null;
        if (Buffer.isBuffer(val)) {
            if (val.length === 16) {
                const hex = val.toString('hex');
                return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`.toUpperCase();
            }
            return val.toString('utf8');
        }
        if (typeof val === 'string' && /^[0-9a-fA-F]{32}$/.test(val)) {
            return `${val.slice(0, 8)}-${val.slice(8, 12)}-${val.slice(12, 16)}-${val.slice(16, 20)}-${val.slice(20, 32)}`.toUpperCase();
        }
        return val;
    }

    public async loadData(tableName: string, rows: Record<string, unknown>[], columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<number> {
        const firstRow = rows[0];
        if (!firstRow) return 0;
        const pool = await this.getPool(config);

        const identCheck = await pool.request().query<{ hasIdent: number }>(`
            SELECT COUNT(*) as hasIdent
            FROM sys.columns
            WHERE object_id = OBJECT_ID(N'[${tableName}]') AND is_identity = 1;
        `).catch(() => ({ recordset: [{ hasIdent: 0 }] }));
        const hasIdentity = (identCheck.recordset[0]?.hasIdent ?? 0) > 0;

        const rowKeys = Object.keys(firstRow).map(k => k.toLowerCase());
        const colNames = rowKeys.map(c => `[${c}]`).join(', ');
        const batchSize = 100;

        try {
            await pool.request().query(`ALTER TABLE [${tableName}] NOCHECK CONSTRAINT ALL; DELETE FROM [${tableName}];`);

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const req = pool.request();
                const valueClauses: string[] = [];
                let paramIndex = 0;

                for (const row of batch) {
                    const rowParamNames: string[] = [];
                    for (const c of rowKeys) {
                        const pName = `p_${paramIndex++}`;
                        rowParamNames.push(`@${pName}`);
                        req.input(pName, this.normalizeParamValue(row[c]));
                    }
                    valueClauses.push(`(${rowParamNames.join(', ')})`);
                }

                let insertSql = '';
                if (hasIdentity) insertSql += `SET IDENTITY_INSERT [${tableName}] ON;\n`;
                insertSql += `INSERT INTO [${tableName}] (${colNames}) VALUES ${valueClauses.join(',\n')};\n`;
                if (hasIdentity) insertSql += `SET IDENTITY_INSERT [${tableName}] OFF;\n`;

                await req.query(insertSql);
            }

            return rows.length;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[MssqlSyncAdapter] Betöltési hiba (${tableName}):`, message);
            return 0;
        } finally {
            await pool.close().catch(() => { });
        }
    }

    public async disableConstraints(config: EngineConnectionConfig): Promise<void> {
        const pool = await this.getPool(config);
        try {
            await pool.request().query("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';");
        } catch { }
        finally {
            await pool.close().catch(() => { });
        }
    }

    public async enableConstraints(config: EngineConnectionConfig): Promise<void> {
        const pool = await this.getPool(config);
        try {
            await pool.request().query("EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all';");
        } catch { }
        finally {
            await pool.close().catch(() => { });
        }
    }

    public async getStats(config: EngineConnectionConfig): Promise<DatabaseStats> {
        const pool = await this.getPool(config);
        try {
            const query = `
                SELECT
                    (SELECT count(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN ('sysdiagrams')) AS total_tables,
                    (SELECT COALESCE(SUM(p.rows), 0) FROM sys.tables t JOIN sys.partitions p ON t.object_id = p.object_id WHERE p.index_id IN (0,1) AND t.name NOT IN ('sysdiagrams')) AS total_rows;
            `;
            const result = await pool.request().query<MsStatsRecord>(query);
            const totalTables = Number(result.recordset[0]?.total_tables) || 0;
            const totalRows = Number(result.recordset[0]?.total_rows) || 0;
            return { totalTables, totalRows };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[MssqlSyncAdapter] Statisztika hiba:', message);
            return { totalTables: 0, totalRows: 0 };
        } finally {
            await pool.close().catch(() => { });
        }
    }
}
