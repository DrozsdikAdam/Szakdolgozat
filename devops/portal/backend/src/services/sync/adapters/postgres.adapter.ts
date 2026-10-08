import fs from "fs";
import pg from "pg";
import { BaseSyncAdapter, execAsync } from "./base.adapter.js";
import type { EngineConnectionConfig, ColumnDefinition, DatabaseStats, TableForeignKeyDependency } from "../types.js";

export class PostgresSyncAdapter extends BaseSyncAdapter {
    readonly engine = 'postgres';

    protected async resolveDatabase(config: EngineConnectionConfig): Promise<string> {
        const k8sFlag = this.getK8sServerFlag();
        const user = config.username || 'postgres';
        const pass = config.password || 'VnUH22Refo';
        const candidates = [config.database, 'mes_db', 'mesdb', 'postgres'].filter(Boolean);

        for (const db of candidates) {
            try {
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "SELECT 1;"`;
                const { stdout } = await execAsync(cmd, { timeout: 3000 });
                if (stdout.trim() === '1') return db as string;
            } catch { }
        }
        return 'mes_db';
    }

    public async discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);

        try {
            const sql = `SELECT tc.table_name || '|' || ccu.table_name FROM information_schema.table_constraints AS tc JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';`;
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "${sql}"`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            return stdout.split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l && l.includes('|'))
                .map(l => {
                    const [child, parent] = l.split('|');
                    return { childTable: (child || '').toLowerCase(), parentTable: (parent || '').toLowerCase() };
                });
        } catch {
            return [];
        }
    }

    public async discoverTables(config: EngineConnectionConfig): Promise<string[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);

        try {
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            const tables = stdout.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
            return await this.sortTablesByDependency(tables, conf);
        } catch (err) {
            console.warn('[PostgresSyncAdapter] Tábla-felfedezés hiba:', (err as any)?.message || err);
            return [];
        }
    }

    public async discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);

        try {
            const sql = `SELECT column_name || '|' || data_type || '|' || COALESCE(character_maximum_length::text, '') || '|' || is_nullable || '|' || (CASE WHEN is_identity = 'YES' OR COALESCE(column_default, '') LIKE 'nextval(%' THEN '1' ELSE '0' END) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${tableName}';`;
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "${sql}"`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            return stdout.split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l && l.includes('|'))
                .map(line => {
                    const [name, dataType, maxLen, isNull, isIdent] = line.split('|');
                    return {
                        name: (name || '').toLowerCase(),
                        dataType: (dataType || 'varchar').toLowerCase(),
                        maxLength: maxLen ? parseInt(maxLen, 10) : null,
                        isNullable: isNull === 'YES',
                        isIdentity: isIdent === '1'
                    };
                });
        } catch {
            return [];
        }
    }

    private mapPgType(c: ColumnDefinition): string {
        const dt = c.dataType.toLowerCase();
        if (dt.includes('uuid') || dt.includes('uniqueidentifier') || (c.maxLength && c.maxLength === 36)) return 'UUID';
        if (dt.includes('int') || dt.includes('smallint') || dt.includes('bigint')) return 'BIGINT';
        if (dt.includes('bool') || dt.includes('bit')) return 'BOOLEAN';
        if (dt.includes('date') || dt.includes('time')) return 'TIMESTAMP';
        if (dt.includes('decimal') || dt.includes('numeric') || dt.includes('float') || dt.includes('real')) return 'NUMERIC(19,4)';
        if (c.maxLength && c.maxLength > 0 && c.maxLength < 1000) return `VARCHAR(${c.maxLength})`;
        return 'TEXT';
    }

    public async ensureTableSchema(tableName: string, columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<void> {
        if (!columns || columns.length === 0) return;
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);

        const colDefs = columns.map(c => `"${c.name.toLowerCase()}" ${this.mapPgType(c)}`).join(', ');
        const createSql = `CREATE TABLE IF NOT EXISTS "${tableName.toLowerCase()}" (${colDefs});`;

        const dbsToUpdate = [db];
        if (db === 'mes_db') dbsToUpdate.push('mesdb');
        if (db === 'mesdb') dbsToUpdate.push('mes_db');

        for (const targetDb of Array.from(new Set(dbsToUpdate))) {
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${targetDb} -c "${createSql}"`).catch(() => { });
            for (const c of columns) {
                const alterSql = `ALTER TABLE "${tableName.toLowerCase()}" ADD COLUMN IF NOT EXISTS "${c.name.toLowerCase()}" ${this.mapPgType(c)};`;
                await execAsync(`kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${targetDb} -d ${targetDb} -c "${alterSql}"`).catch(() => { });
            }
        }
    }

    public async extractData(tableName: string, config: EngineConnectionConfig): Promise<any[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);

        try {
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "SELECT COALESCE(json_agg(t), '[]'::json) FROM (SELECT * FROM \\"${tableName}\\") t;"`;
            const { stdout } = await execAsync(cmd, { timeout: 120000, maxBuffer: 100 * 1024 * 1024 });
            const jsonText = stdout.trim();
            if (!jsonText || jsonText === '[]') return [];
            return this.normalizeExtractedRows(JSON.parse(jsonText));
        } catch (err) {
            console.warn(`[PostgresSyncAdapter] Extract hiba a(z) ${tableName} táblánál:`, (err as any)?.message || err);
            return [];
        }
    }

    private formatSqlValue(val: unknown, colDef?: ColumnDefinition, colName?: string): string {
        if (val === null || val === undefined) return 'NULL';

        if (this.isBooleanValue(val, colDef, colName)) {
            const isTrue = val === true || val === 1 || val === '1' || String(val).toLowerCase() === 'true';
            return isTrue ? "'true'" : "'false'";
        }

        if (typeof val === 'number') {
            return String(val);
        }

        return `'${String(val).replace(/'/g, "''")}'`;
    }

    public async loadData(tableName: string, rows: any[], columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<number> {
        if (!rows || rows.length === 0) return 0;
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);
        const rowKeys = Object.keys(rows[0]).map(k => k.toLowerCase());
        const colNames = rowKeys.map(c => `"${c.toLowerCase()}"`).join(', ');
        const batchSize = 250;

        const dbsToUpdate = [db];
        if (db === 'mes_db') dbsToUpdate.push('mesdb');
        if (db === 'mesdb') dbsToUpdate.push('mes_db');

        for (const targetDb of Array.from(new Set(dbsToUpdate))) {
            let fullSql = `SET session_replication_role = 'replica';\nTRUNCATE TABLE "${tableName.toLowerCase()}" CASCADE;\n`;

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const valuesList = batch.map(row => {
                    const vals = rowKeys.map(c => {
                        const colDef = columns.find(cd => cd.name.toLowerCase() === c);
                        return this.formatSqlValue(row[c], colDef, c);
                    });
                    return `(${vals.join(', ')})`;
                }).join(',\n');

                fullSql += `INSERT INTO "${tableName.toLowerCase()}" (${colNames}) VALUES ${valuesList} ON CONFLICT DO NOTHING;\n`;
            }

            fullSql += `SET session_replication_role = 'origin';\n`;
            const tempSqlFile = `/tmp/sync_pg_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`;
            try {
                fs.writeFileSync(tempSqlFile, fullSql);
                await execAsync(`cat ${tempSqlFile} | kubectl ${k8sFlag} exec -i -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${targetDb}`);
            } finally {
                if (fs.existsSync(tempSqlFile)) fs.unlinkSync(tempSqlFile);
            }
        }
        return rows.length;
    }

    public async disableConstraints(config?: EngineConnectionConfig): Promise<void> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);

        const dbsToUpdate = Array.from(new Set([db, 'mes_db', 'mesdb'].filter(Boolean)));
        const sql = `DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'ALTER TABLE "' || r.tablename || '" DISABLE TRIGGER ALL'; END LOOP; END $$;`;

        for (const targetDb of dbsToUpdate) {
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${targetDb} -c "${sql}"`).catch(() => { });
        }
    }

    public async enableConstraints(config?: EngineConnectionConfig): Promise<void> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'postgres';
        const pass = conf.password || 'VnUH22Refo';
        const db = await this.resolveDatabase(conf);

        const dbsToUpdate = Array.from(new Set([db, 'mes_db', 'mesdb'].filter(Boolean)));
        const sql = `DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'ALTER TABLE "' || r.tablename || '" ENABLE TRIGGER ALL'; END LOOP; END $$;`;

        for (const targetDb of dbsToUpdate) {
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${targetDb} -c "${sql}"`).catch(() => { });
        }
    }

    public async getStats(config: EngineConnectionConfig): Promise<DatabaseStats> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const pass = conf.password || 'VnUH22Refo';
        const user = conf.username && conf.username !== 'sa' ? conf.username : 'postgres';
        const dbNames = ['mes_db', 'postgres', conf.database, 'mesdb'].filter(Boolean);
        const host = conf.host || 'localhost';

        const hostsToTry = [
            host.includes('svc.cluster.local') ? 'postgres-postgresql-ha-postgresql.platform-infra.svc.cluster.local' : host,
            'host.docker.internal',
            'localhost'
        ];

        for (const h of hostsToTry) {
            for (const db of dbNames) {
                try {
                    const client = new pg.Client({
                        host: h,
                        port: conf.port || 5432,
                        database: db,
                        user,
                        password: pass,
                        connectionTimeoutMillis: 1500
                    });
                    await client.connect();
                    const tablesRes = await client.query(
                        "SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
                    );
                    const rowsRes = await client.query(
                        "SELECT COALESCE(SUM(n_live_tup), 0)::bigint as total_rows FROM pg_stat_user_tables"
                    );
                    await client.end();

                    const totalTables = Number(tablesRes.rows[0]?.count) || 0;
                    const totalRows = Number(rowsRes.rows[0]?.total_rows) || 0;
                    if (totalTables > 1 || totalRows > 0) {
                        return { totalTables, totalRows };
                    }
                } catch { }
            }
        }

        for (const db of ['mes_db', 'postgres', conf.database].filter(Boolean)) {
            try {
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U postgres -d ${db} -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'; SELECT COALESCE(SUM(c), 0) FROM (SELECT (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::int as c FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') t;"`;
                const { stdout } = await execAsync(cmd, { timeout: 8000 });
                const lines = stdout.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                if (lines.length >= 2) {
                    const totalTables = parseInt(lines[0] ?? '0', 10) || 0;
                    const totalRows = parseInt(lines[1] ?? '0', 10) || 0;
                    if (totalTables > 1 || totalRows > 0) {
                        return { totalTables, totalRows };
                    }
                }
            } catch { }
        }

        return { totalTables: 0, totalRows: 0 };
    }
}
