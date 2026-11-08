import oracledb from "oracledb";
import { BaseSyncAdapter } from "./base.adapter.js";
import type { EngineConnectionConfig, ColumnDefinition, DatabaseStats, TableForeignKeyDependency } from "../types.js";

type OracleFkTuple = [string, string];
type OracleTableTuple = [string];
type OracleColumnTuple = [string, string, number | null, string, string];

interface OracleStatsOutBinds {
    out_tables?: number;
    out_rows?: number;
}

export class OracleSyncAdapter extends BaseSyncAdapter {
    readonly engine = 'oracle';

    private async getConnection(config: EngineConnectionConfig): Promise<oracledb.Connection> {
        const conf = this.normalizeConfig(config);
        const { host, port } = this.resolveTcpEndpoint(conf, 1521, 31521);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';

        return await oracledb.getConnection({
            user,
            password: pass,
            connectString: `${host}:${port}/${db}`
        });
    }

    public async discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]> {
        const conn = await this.getConnection(config);
        try {
            const sql = `
                SELECT
                    lower(a.table_name) AS child_table,
                    lower(c_pk.table_name) AS parent_table
                FROM user_constraints a
                JOIN user_constraints c_pk ON a.r_constraint_name = c_pk.constraint_name
                WHERE a.constraint_type = 'R' AND a.table_name NOT LIKE 'BIN$%'
            `;
            const result = await conn.execute<OracleFkTuple>(sql);
            if (!result.rows) return [];
            return result.rows.map(([child, parent]) => ({
                childTable: child.toLowerCase(),
                parentTable: parent.toLowerCase()
            }));
        } catch {
            return [];
        } finally {
            await conn.close().catch(() => { });
        }
    }

    public async discoverTables(config: EngineConnectionConfig): Promise<string[]> {
        const conn = await this.getConnection(config);
        try {
            const sql = `SELECT lower(table_name) FROM user_tables WHERE table_name NOT LIKE 'BIN$%' ORDER BY table_name`;
            const result = await conn.execute<OracleTableTuple>(sql);
            if (!result.rows) return [];
            const tables = result.rows.map(([t]) => t.toLowerCase());
            return await this.sortTablesByDependency(tables, config);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[OracleSyncAdapter] Tábla-felfedezés hiba:', message);
            return [];
        } finally {
            await conn.close().catch(() => { });
        }
    }

    public async discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]> {
        const conn = await this.getConnection(config);
        try {
            const sql = `
                SELECT lower(column_name), lower(data_type), data_length, nullable, identity_column
                FROM user_tab_cols
                WHERE table_name = :tname
            `;
            const result = await conn.execute<OracleColumnTuple>(sql, { tname: tableName.toUpperCase() });
            if (!result.rows) return [];
            return result.rows.map(([name, dataType, maxLen, isNull, isIdent]) => ({
                name: name.toLowerCase(),
                dataType: dataType.toLowerCase(),
                maxLength: maxLen ? Number(maxLen) : null,
                isNullable: isNull === 'Y',
                isIdentity: isIdent === 'YES'
            }));
        } catch {
            return [];
        } finally {
            await conn.close().catch(() => { });
        }
    }

    private mapOraType(c: ColumnDefinition): string {
        const dt = c.dataType.toLowerCase();
        if (dt.includes('uuid') || dt.includes('uniqueidentifier') || (c.maxLength && c.maxLength === 36)) return 'CHAR(36)';
        if (dt.includes('int') || dt.includes('number') || dt.includes('smallint')) return 'NUMBER';
        if (dt.includes('bool') || dt.includes('bit')) return 'NUMBER(1)';
        if (dt.includes('date') || dt.includes('time')) return 'TIMESTAMP(6)';
        if (dt.includes('decimal') || dt.includes('numeric') || dt.includes('float') || dt.includes('real') || dt.includes('double') || dt.includes('precision')) return 'NUMBER(19,4)';
        if (c.maxLength && c.maxLength > 0 && c.maxLength <= 4000) return `VARCHAR2(${c.maxLength})`;
        if (dt.includes('char') || dt.includes('text')) return 'VARCHAR2(4000)';
        return 'CLOB';
    }

    public async ensureTableSchema(tableName: string, columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<void> {
        if (!columns || columns.length === 0) return;
        const conn = await this.getConnection(config);
        const upperTable = tableName.toUpperCase();
        try {
            const colDefs = columns.map(c => `"${c.name.toUpperCase()}" ${this.mapOraType(c)}`).join(', ');
            const plsql = `
                BEGIN
                    BEGIN
                        EXECUTE IMMEDIATE 'CREATE TABLE "${upperTable}" (${colDefs})';
                    EXCEPTION WHEN OTHERS THEN
                        IF SQLCODE != -955 THEN RAISE; END IF;
                    END;
                END;
            `;
            await conn.execute(plsql);

            for (const c of columns) {
                const addColPlsql = `
                    BEGIN
                        EXECUTE IMMEDIATE 'ALTER TABLE "${upperTable}" ADD ("${c.name.toUpperCase()}" ${this.mapOraType(c)})';
                    EXCEPTION WHEN OTHERS THEN
                        IF SQLCODE != -1430 THEN NULL; END IF;
                    END;
                `;
                await conn.execute(addColPlsql).catch(() => { });
            }
        } finally {
            await conn.close().catch(() => { });
        }
    }

    public async extractData(tableName: string, config: EngineConnectionConfig): Promise<Record<string, unknown>[]> {
        const conn = await this.getConnection(config);
        try {
            const result = await conn.execute<Record<string, unknown>>(`SELECT * FROM "${tableName.toUpperCase()}"`, [], {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });
            if (!result.rows) return [];
            return this.normalizeExtractedRows(result.rows);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[OracleSyncAdapter] Extract hiba (${tableName}):`, message);
            return [];
        } finally {
            await conn.close().catch(() => { });
        }
    }

    private normalizeOracleValue(val: unknown, colName: string, targetType?: string, tableName?: string): unknown {
        if (val === null || val === undefined) return null;

        if (typeof val === 'boolean') {
            return val ? 1 : 0;
        }

        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(val)) {
            return new Date(val);
        }

        if (typeof val === 'string') {
            const isHex32 = /^[0-9a-fA-F]{32}$/.test(val);
            const isUuid36 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

            const isKnownRaw = (
                (tableName?.toLowerCase() === 'roles' && colName.toLowerCase() === 'id') ||
                (tableName?.toLowerCase() === 'products' && colName.toLowerCase() === 'id') ||
                (tableName?.toLowerCase() === 'notifications' && colName.toLowerCase() === 'id') ||
                (tableName?.toLowerCase() === 'audit_logs' && (colName.toLowerCase() === 'id' || colName.toLowerCase() === 'user_id'))
            );

            const isRawTarget = targetType ? targetType.includes('raw') : isKnownRaw;
            if (isRawTarget && (isHex32 || isUuid36)) {
                const cleanHex = val.replace(/-/g, '');
                return Buffer.from(cleanHex, 'hex');
            }
        }

        return val;
    }

    public async loadData(tableName: string, rows: Record<string, unknown>[], columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<number> {
        const firstRow = rows[0];
        if (!firstRow) return 0;
        const conn = await this.getConnection(config);
        const upperTable = tableName.toUpperCase();

        try {
            const targetCols = await this.discoverColumns(tableName, config).catch(() => []);
            const targetTypeMap = new Map(targetCols.map(c => [c.name.toLowerCase(), c.dataType.toLowerCase()]));

            await conn.execute(`DELETE FROM "${upperTable}"`).catch(() => { });
            await conn.commit();

            const rowKeys = Object.keys(firstRow).map(k => k.toLowerCase());
            const colNames = rowKeys.map(c => `"${c.toUpperCase()}"`).join(', ');
            const bindPlaceholders = rowKeys.map((_, i) => `:b${i}`).join(', ');
            const insertSql = `INSERT INTO "${upperTable}" (${colNames}) VALUES (${bindPlaceholders})`;

            const batchSize = 100;
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                for (const row of batch) {
                    const bindValues = rowKeys.map(c => {
                        const targetType = targetTypeMap.get(c.toLowerCase());
                        return this.normalizeOracleValue(row[c], c, targetType, tableName);
                    });
                    await conn.execute(insertSql, bindValues).catch(() => { });
                }
                await conn.commit();
            }

            return rows.length;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[OracleSyncAdapter] Betöltési hiba (${upperTable}):`, message);
            return 0;
        } finally {
            await conn.close().catch(() => { });
        }
    }

    public async disableConstraints(config: EngineConnectionConfig): Promise<void> {
        const conn = await this.getConnection(config);
        try {
            const plsql = `
                BEGIN
                    FOR c IN (SELECT table_name, constraint_name FROM user_constraints WHERE constraint_type = 'R') LOOP
                        BEGIN
                            EXECUTE IMMEDIATE 'ALTER TABLE "' || c.table_name || '" DISABLE CONSTRAINT "' || c.constraint_name || '"';
                        EXCEPTION WHEN OTHERS THEN NULL;
                        END;
                    END LOOP;
                END;
            `;
            await conn.execute(plsql);
        } catch { }
        finally {
            await conn.close().catch(() => { });
        }
    }

    public async enableConstraints(config: EngineConnectionConfig): Promise<void> {
        const conn = await this.getConnection(config);
        try {
            const plsql = `
                BEGIN
                    FOR c IN (SELECT table_name, constraint_name FROM user_constraints WHERE constraint_type = 'R') LOOP
                        BEGIN
                            EXECUTE IMMEDIATE 'ALTER TABLE "' || c.table_name || '" ENABLE NOVALIDATE CONSTRAINT "' || c.constraint_name || '"';
                        EXCEPTION WHEN OTHERS THEN NULL;
                        END;
                    END LOOP;
                END;
            `;
            await conn.execute(plsql);
        } catch { }
        finally {
            await conn.close().catch(() => { });
        }
    }

    public async getStats(config: EngineConnectionConfig): Promise<DatabaseStats> {
        const conn = await this.getConnection(config);
        try {
            const plsql = `
                DECLARE
                    v_tables NUMBER := 0;
                    v_rows NUMBER := 0;
                    v_cnt NUMBER;
                BEGIN
                    SELECT count(*) INTO v_tables FROM user_tables WHERE table_name NOT LIKE 'BIN$%';
                    FOR t IN (SELECT table_name FROM user_tables WHERE table_name NOT LIKE 'BIN$%') LOOP
                        BEGIN
                            EXECUTE IMMEDIATE 'SELECT count(*) FROM "' || t.table_name || '"' INTO v_cnt;
                            v_rows := v_rows + v_cnt;
                        EXCEPTION WHEN OTHERS THEN NULL;
                        END;
                    END LOOP;
                    :out_tables := v_tables;
                    :out_rows := v_rows;
                END;
            `;
            const result = await conn.execute(plsql, {
                out_tables: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                out_rows: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            });
            const outBinds = result.outBinds as OracleStatsOutBinds;
            return {
                totalTables: outBinds?.out_tables || 0,
                totalRows: outBinds?.out_rows || 0
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[OracleSyncAdapter] Statisztika hiba:', message);
            return { totalTables: 0, totalRows: 0 };
        } finally {
            await conn.close().catch(() => { });
        }
    }
}
