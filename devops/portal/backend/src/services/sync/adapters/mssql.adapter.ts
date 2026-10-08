import fs from "fs";
import { BaseSyncAdapter, execAsync } from "./base.adapter.js";
import type { EngineConnectionConfig, ColumnDefinition, DatabaseStats, TableForeignKeyDependency } from "../types.js";

export class MssqlSyncAdapter extends BaseSyncAdapter {
    readonly engine = 'mssql';

    protected async resolveDatabase(config: EngineConnectionConfig): Promise<string> {
        const k8sFlag = this.getK8sServerFlag();
        const user = config.username || 'sa';
        const pass = config.password || 'MesStrongPass123!';
        const targetDb = config.database || 'mesdb';

        try {
            const createSql = `IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${targetDb}') CREATE DATABASE [${targetDb}];`;
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "${createSql}"`, { timeout: 8000 }).catch(() => { });
            return targetDb;
        } catch { }
        return targetDb;
    }

    public async discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);

        try {
            const sql = `SET NOCOUNT ON; USE [${db}]; SELECT tp.name + '|' + tr.name FROM sys.foreign_keys fk INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id;`;
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "${sql}" -h -1 -W`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            return stdout.split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l && l.includes('|') && !l.startsWith('(') && !l.includes('Changed database'))
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
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);

        try {
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "SET NOCOUNT ON; USE [${db}]; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN ('sysdiagrams') ORDER BY TABLE_NAME;" -h -1 -W`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            const tables = stdout
                .split(/\r?\n/)
                .map(t => t.trim())
                .filter(t => t && !t.includes('Changed database context') && !t.startsWith('('));
            return await this.sortTablesByDependency(tables, conf);
        } catch (err) {
            console.warn('[MssqlSyncAdapter] MSSQL tábla-felfedezés hiba:', (err as any)?.message || err);
            return [];
        }
    }

    public async discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);

        try {
            const sql = `SET NOCOUNT ON; USE [${db}]; SELECT c.COLUMN_NAME + '|' + c.DATA_TYPE + '|' + COALESCE(CAST(c.CHARACTER_MAXIMUM_LENGTH AS VARCHAR), '') + '|' + c.IS_NULLABLE + '|' + CAST(COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS VARCHAR) FROM INFORMATION_SCHEMA.COLUMNS c WHERE c.TABLE_NAME = '${tableName}';`;
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "${sql}" -h -1 -W`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            return stdout.split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l && l.includes('|'))
                .map(line => {
                    const [name, dataType, maxLen, isNull, isIdent] = line.split('|');
                    return {
                        name: (name || '').toLowerCase(),
                        dataType: (dataType || 'nvarchar').toLowerCase(),
                        maxLength: maxLen ? parseInt(maxLen, 10) : null,
                        isNullable: isNull === 'YES',
                        isIdentity: isIdent === '1'
                    };
                });
        } catch {
            return [];
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
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);

        const colDefs = columns.map(c => `[${c.name.toLowerCase()}] ${this.mapMsType(c)}`).join(', ');
        let fullMssql = `USE [${db}]; IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${tableName}') CREATE TABLE [${tableName}] (${colDefs});\n`;
        for (const c of columns) {
            fullMssql += `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${tableName}]') AND name = '${c.name.toLowerCase()}') ALTER TABLE [${tableName}] ADD [${c.name.toLowerCase()}] ${this.mapMsType(c)} NULL;\n`;
        }

        const b64 = Buffer.from(fullMssql).toString('base64');
        await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- bash -c "echo '${b64}' | base64 -d | /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P '${pass}' -C"`).catch(() => { });
    }

    public async extractData(tableName: string, config: EngineConnectionConfig): Promise<any[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);

        try {
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "SET NOCOUNT ON; USE [${db}]; SELECT * FROM [${tableName}] FOR JSON PATH;" -y 0`;
            const { stdout } = await execAsync(cmd, { timeout: 120000, maxBuffer: 100 * 1024 * 1024 });
            const lines = stdout
                .split(/\r?\n/)
                .filter(line => !line.startsWith('Changed database') && !line.startsWith('('));
            const jsonText = lines.join('').trim();
            if (!jsonText || jsonText === '[]') return [];
            return this.normalizeExtractedRows(JSON.parse(jsonText));
        } catch (err) {
            console.warn(`[MssqlSyncAdapter] MSSQL extract hiba a(z) ${tableName} táblánál:`, (err as any)?.message || err);
            return [];
        }
    }

    private formatSqlValue(val: unknown, colDef?: ColumnDefinition, colName?: string): string {
        if (val === null || val === undefined) return 'NULL';

        if (this.isBooleanValue(val, colDef, colName)) {
            const isTrue = val === true || val === 1 || val === '1' || String(val).toLowerCase() === 'true';
            return isTrue ? '1' : '0';
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
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);
        const rowKeys = Object.keys(rows[0]).map(k => k.toLowerCase());
        const colNames = rowKeys.map(c => `[${c.toLowerCase()}]`).join(', ');
        const hasIdentity = columns.some(c => c.isIdentity);
        const batchSize = 100;

        let fullSql = `USE [${db}]; ALTER TABLE [${tableName}] NOCHECK CONSTRAINT ALL; DELETE FROM [${tableName}];\n`;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const valuesList = batch.map(row => {
                const vals = rowKeys.map(c => {
                    const colDef = columns.find(cd => cd.name.toLowerCase() === c);
                    return this.formatSqlValue(row[c], colDef, c);
                });
                return `(${vals.join(', ')})`;
            }).join(',\n');

            if (hasIdentity) fullSql += `SET IDENTITY_INSERT [${tableName}] ON;\n`;
            fullSql += `INSERT INTO [${tableName}] (${colNames}) VALUES ${valuesList};\n`;
            if (hasIdentity) fullSql += `SET IDENTITY_INSERT [${tableName}] OFF;\n`;
        }

        fullSql += `ALTER TABLE [${tableName}] CHECK CONSTRAINT ALL;\n`;
        const tempSqlFile = `/tmp/sync_ms_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`;
        try {
            fs.writeFileSync(tempSqlFile, fullSql);
            await execAsync(`cat ${tempSqlFile} | kubectl ${k8sFlag} exec -i -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P '${pass}' -C`);
            return rows.length;
        } catch (err) {
            console.warn(`[MssqlSyncAdapter] MSSQL betöltési hiba (${tableName}):`, (err as any)?.message || err);
            return 0;
        } finally {
            if (fs.existsSync(tempSqlFile)) fs.unlinkSync(tempSqlFile);
        }
    }

    public async disableConstraints(config: EngineConnectionConfig): Promise<void> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);
        await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "USE [${db}]; EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';"`).catch(() => { });
    }

    public async enableConstraints(config: EngineConnectionConfig): Promise<void> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const db = await this.resolveDatabase(conf);
        await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "USE [${db}]; EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all';"`).catch(() => { });
    }

    public async getStats(config: EngineConnectionConfig): Promise<DatabaseStats> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'sa';
        const pass = conf.password || 'MesStrongPass123!';
        const dbName = conf.database || 'mesdb';

        try {
            const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "SET NOCOUNT ON; DECLARE @db NVARCHAR(128); SELECT TOP 1 @db = name FROM sys.databases WHERE name IN ('mesdb', 'mes_db', '${dbName}') ORDER BY CASE WHEN name = '${dbName}' THEN 1 WHEN name = 'mesdb' THEN 2 ELSE 3 END; IF @db IS NOT NULL BEGIN DECLARE @sql NVARCHAR(MAX) = 'SELECT (SELECT count(*) FROM ' + QUOTENAME(@db) + '.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = ''BASE TABLE'') AS total_tables, (SELECT COALESCE(SUM(p.rows), 0) FROM ' + QUOTENAME(@db) + '.sys.tables t JOIN ' + QUOTENAME(@db) + '.sys.partitions p ON t.object_id = p.object_id WHERE p.index_id IN (0,1)) AS total_rows;'; EXEC sp_executesql @sql; END ELSE SELECT 0, 0;" -h -1 -W`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            const parts = stdout.trim().split(/\s+/).filter(Boolean);
            if (parts.length >= 2) {
                const totalTables = parseInt(parts[0] ?? '0', 10) || 0;
                const totalRows = parseInt(parts[1] ?? '0', 10) || 0;
                return { totalTables, totalRows };
            }
        } catch (err) {
            console.warn('[MssqlSyncAdapter] MSSQL statisztika hiba:', (err as any)?.message || err);
        }

        return { totalTables: 0, totalRows: 0 };
    }
}
