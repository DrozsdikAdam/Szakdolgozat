import fs from "fs";
import { BaseSyncAdapter, execAsync } from "./base.adapter.js";
import type { EngineConnectionConfig, ColumnDefinition, DatabaseStats, TableForeignKeyDependency } from "../types.js";

export class OracleSyncAdapter extends BaseSyncAdapter {
    readonly engine = 'oracle';

    public async discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';

        try {
            const sql = `SET PAGESIZE 0\nSET FEEDBACK OFF\nSELECT lower(a.table_name) || '~' || lower(c_pk.table_name) FROM user_constraints a JOIN user_constraints c_pk ON a.r_constraint_name = c_pk.constraint_name WHERE a.constraint_type = 'R';\nEXIT;\n`;
            const b64 = Buffer.from(sql).toString('base64');
            const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            return stdout.split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l && l.includes('~'))
                .map(l => {
                    const [child, parent] = l.split('~');
                    return { childTable: (child || '').toLowerCase(), parentTable: (parent || '').toLowerCase() };
                });
        } catch {
            return [];
        }
    }

    public async discoverTables(config: EngineConnectionConfig): Promise<string[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';

        try {
            const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "printf 'SET PAGESIZE 0\\nSET FEEDBACK OFF\\nSELECT lower(table_name) FROM user_tables ORDER BY table_name;\\nEXIT;\\n' | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            const tables = stdout.split(/\r?\n/).map(t => t.trim().toLowerCase()).filter(Boolean);
            return await this.sortTablesByDependency(tables, conf);
        } catch (err) {
            console.warn('[OracleSyncAdapter] Oracle tábla-felfedezés hiba:', (err as any)?.message || err);
            return [];
        }
    }

    public async discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';

        try {
            const sql = `SET PAGESIZE 0\nSET FEEDBACK OFF\nSELECT lower(column_name) || '~' || lower(data_type) || '~' || data_length || '~' || nullable || '~' || (CASE WHEN identity_column = 'YES' THEN '1' ELSE '0' END) FROM user_tab_cols WHERE table_name = '${tableName.toUpperCase()}';\nEXIT;\n`;
            const b64 = Buffer.from(sql).toString('base64');
            const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            return stdout.split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l && l.includes('~'))
                .map(line => {
                    const [name, dataType, maxLen, isNull, isIdent] = line.split('~');
                    return {
                        name: (name || '').toLowerCase(),
                        dataType: (dataType || 'varchar2').toLowerCase(),
                        maxLength: maxLen ? parseInt(maxLen, 10) : null,
                        isNullable: isNull === 'Y',
                        isIdentity: isIdent === '1'
                    };
                });
        } catch {
            return [];
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

    private formatOracleColumnName(colName: string): string {
        return `"${colName.toUpperCase()}"`;
    }

    public async ensureTableSchema(tableName: string, columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<void> {
        if (!columns || columns.length === 0) return;
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';

        const colDefs = columns.map(c => `${this.formatOracleColumnName(c.name)} ${this.mapOraType(c)}`).join(', ');
        const createSql = `BEGIN EXECUTE IMMEDIATE 'DROP TABLE "${tableName.toUpperCase()}" CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;\n/\nBEGIN EXECUTE IMMEDIATE 'CREATE TABLE "${tableName.toUpperCase()}" (${colDefs})'; END;\n/\nCOMMIT;\nEXIT;\n`;
        const b64 = Buffer.from(createSql).toString('base64');
        await execAsync(`kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`).catch(() => { });
    }

    public async extractData(tableName: string, config: EngineConnectionConfig): Promise<any[]> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';

        try {
            const plsql = `SET LONG 2000000000\nSET LONGCHUNKSIZE 65535\nSET PAGESIZE 0\nSET FEEDBACK OFF\nSET LINESIZE 32767\nSELECT COALESCE(json_arrayagg(json_object(* RETURNING CLOB) RETURNING CLOB), TO_CLOB('[]')) FROM "${tableName.toUpperCase()}";\nEXIT;\n`;
            const b64 = Buffer.from(plsql).toString('base64');
            const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`;
            const { stdout } = await execAsync(cmd, { timeout: 120000, maxBuffer: 100 * 1024 * 1024 });
            const lines = stdout
                .split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l && !l.startsWith('SQL>') && !l.startsWith('Connected') && !l.startsWith('Disconnected'));
            const jsonText = lines.join('').trim();
            if (!jsonText || jsonText === '[]') return [];

            try {
                return this.normalizeExtractedRows(JSON.parse(jsonText));
            } catch {
                const sanitized = jsonText.replace(/[\x00-\x1F\x7F]/g, (ch) => {
                    if (ch === '\n') return '\\n';
                    if (ch === '\r') return '\\r';
                    if (ch === '\t') return '\\t';
                    return '';
                });
                return this.normalizeExtractedRows(JSON.parse(sanitized));
            }
        } catch (err) {
            console.warn(`[OracleSyncAdapter] Oracle extract hiba a(z) ${tableName} táblánál:`, (err as any)?.message || err);
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

        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(val)) {
            const cleanDate = val.replace('T', ' ').substring(0, 19);
            return `TO_TIMESTAMP('${cleanDate}', 'YYYY-MM-DD HH24:MI:SS')`;
        }

        return `'${String(val).replace(/'/g, "''")}'`;
    }

    public async loadData(tableName: string, rows: any[], columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<number> {
        if (!rows || rows.length === 0) return 0;
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';

        const rowKeys = Object.keys(rows[0]).map(k => k.toLowerCase());
        const colNames = rowKeys.map(c => this.formatOracleColumnName(c)).join(', ');

        const deleteSql = `DELETE FROM "${tableName.toUpperCase()}";\nCOMMIT;\nEXIT;\n`;
        const tempDelFile = `/tmp/sync_ora_del_${Date.now()}.sql`;
        try {
            fs.writeFileSync(tempDelFile, deleteSql);
            await execAsync(`cat ${tempDelFile} | kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- sqlplus -s ${user}/${pass}@localhost:1521/${db}`).catch(() => { });
        } finally {
            if (fs.existsSync(tempDelFile)) fs.unlinkSync(tempDelFile);
        }

        const batchSize = 250;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            let sqlStatements = 'SET DEFINE OFF\n';
            for (const row of batch) {
                const vals = rowKeys.map(c => {
                    const colDef = columns.find(cd => cd.name.toLowerCase() === c);
                    return this.formatSqlValue(row[c], colDef, c);
                });
                sqlStatements += `INSERT INTO "${tableName.toUpperCase()}" (${colNames}) VALUES (${vals.join(', ')});\n`;
            }
            sqlStatements += `COMMIT;\nEXIT;\n`;

            const tempSqlFile = `/tmp/sync_ora_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`;
            try {
                fs.writeFileSync(tempSqlFile, sqlStatements);
                await execAsync(`cat ${tempSqlFile} | kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- sqlplus -s ${user}/${pass}@localhost:1521/${db}`);
            } finally {
                if (fs.existsSync(tempSqlFile)) fs.unlinkSync(tempSqlFile);
            }
        }
        return rows.length;
    }

    public async disableConstraints(config: EngineConnectionConfig): Promise<void> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';
        const plsql = `BEGIN FOR c IN (SELECT table_name, constraint_name FROM user_constraints WHERE constraint_type = 'R') LOOP BEGIN EXECUTE IMMEDIATE 'ALTER TABLE "' || c.table_name || '" DISABLE CONSTRAINT "' || c.constraint_name || '"'; EXCEPTION WHEN OTHERS THEN NULL; END; END LOOP; END;\n/\nEXIT;\n`;
        const b64 = Buffer.from(plsql).toString('base64');
        await execAsync(`kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`).catch(() => { });
    }

    public async enableConstraints(config: EngineConnectionConfig): Promise<void> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const user = conf.username || 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database || 'FREEPDB1';
        const plsql = `BEGIN FOR c IN (SELECT table_name, constraint_name FROM user_constraints WHERE constraint_type = 'R') LOOP BEGIN EXECUTE IMMEDIATE 'ALTER TABLE "' || c.table_name || '" ENABLE NOVALIDATE CONSTRAINT "' || c.constraint_name || '"'; EXCEPTION WHEN OTHERS THEN NULL; END; END LOOP; END;\n/\nEXIT;\n`;
        const b64 = Buffer.from(plsql).toString('base64');
        await execAsync(`kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`).catch(() => { });
    }

    public async getStats(config: EngineConnectionConfig): Promise<DatabaseStats> {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(config);
        const oracleUser = conf.username && conf.username !== 'postgres' && conf.username !== 'sa' && conf.username !== 'system' ? conf.username : 'mesuser';
        const pass = conf.password || 'mespassword';
        const db = conf.database && conf.database !== 'mes_db' && conf.database !== 'mesdb' && conf.database !== 'postgres' ? conf.database : 'FREEPDB1';

        try {
            const sql = "printf 'SET PAGESIZE 0\\nSET FEEDBACK OFF\\nSET SERVEROUTPUT ON\\nSELECT count(*) FROM user_tables;\\nDECLARE v_total NUMBER := 0; v_cnt NUMBER; BEGIN FOR t IN (SELECT table_name FROM user_tables) LOOP EXECUTE IMMEDIATE \\x27SELECT count(*) FROM \\x27 || t.table_name INTO v_cnt; v_total := v_total + v_cnt; END LOOP; DBMS_OUTPUT.PUT_LINE(v_total); END;\\n/\\nEXIT;\\n'";
            const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "${sql} | sqlplus -s ${oracleUser}/${pass}@localhost:1521/${db}"`;
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            const lines = stdout.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length >= 2) {
                const totalTables = parseInt(lines[0] ?? '0', 10) || 0;
                const totalRows = parseInt(lines[1] ?? '0', 10) || 0;
                return { totalTables, totalRows };
            }
        } catch (err) {
            console.warn('[OracleSyncAdapter] Oracle statisztika hiba:', (err as any)?.message || err);
        }

        return { totalTables: 0, totalRows: 0 };
    }
}
