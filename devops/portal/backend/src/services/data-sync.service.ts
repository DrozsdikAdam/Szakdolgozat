import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { DEFAULT_INTERNAL_HOSTS, DEFAULT_INTERNAL_CREDENTIALS } from "../constants/database.constants.js";

const execAsync = promisify(exec);

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

export interface EngineConnectionConfig {
    host?: string | undefined;
    port?: number | undefined;
    database?: string | undefined;
    username?: string | undefined;
    password?: string | undefined;
    mode?: string | undefined;
}

export class DataSyncService {
    private getK8sServerFlag = (): string => {
        try {
            const kubeConfigPath = process.env.KUBECONFIG || '/app/.kube/config';
            if (fs.existsSync(kubeConfigPath)) {
                const content = fs.readFileSync(kubeConfigPath, 'utf8');
                const portMatch = content.match(/server:\s*https?:\/\/[^:]+:(\d+)/);
                const port = portMatch ? portMatch[1] : '61682';
                const host = process.env.K8S_SERVER_HOST || 'host.docker.internal';
                return `--server=https://${host}:${port} --insecure-skip-tls-verify=true`;
            }
        } catch { }
        return process.env.K8S_SERVER_HOST ? `--server=https://${process.env.K8S_SERVER_HOST}:61682 --insecure-skip-tls-verify=true` : '';
    };

    /**
     * Hitelesítő adatok biztonságos normalizálása belső (internal) motorokhoz.
     * Ha a kapott config egy másik motorból maradt fent (pl. sa a postgresnél), automatikusan felülbírálja.
     */
    public normalizeConfig = (engine: string, config?: EngineConnectionConfig): EngineConnectionConfig => {
        const engineKey = engine as keyof typeof DEFAULT_INTERNAL_CREDENTIALS;
        const defaults = DEFAULT_INTERNAL_CREDENTIALS[engineKey];
        if (!defaults) return config || {};

        const isInternal = !config || config.mode === 'internal' || (config.host && config.host.includes('.svc.cluster.local'));
        if (isInternal) {
            return {
                host: config?.host && !config.host.includes('postgres-master') ? config.host : DEFAULT_INTERNAL_HOSTS[engineKey],
                port: config?.port || (engine === 'postgres' ? 5432 : engine === 'mssql' ? 1433 : 1521),
                database: defaults.database,
                username: defaults.username,
                password: defaults.password,
                mode: 'internal'
            };
        }

        return config || {};
    };

    private resolvePostgresDb = async (k8sFlag: string, user: string, pass: string, preferredDb?: string): Promise<string> => {
        const candidates = [preferredDb, 'mes_db', 'mesdb', 'postgres'].filter(Boolean);
        for (const db of candidates) {
            try {
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "SELECT 1;"`;
                const { stdout } = await execAsync(cmd, { timeout: 3000 });
                if (stdout.trim() === '1') return db as string;
            } catch { }
        }
        return 'mes_db';
    };

    private resolveMssqlDb = async (k8sFlag: string, user: string, pass: string, preferredDb?: string): Promise<string> => {
        try {
            const targetDb = preferredDb || 'mesdb';
            const createSql = `IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${targetDb}') CREATE DATABASE [${targetDb}];`;
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "${createSql}"`, { timeout: 8000 }).catch(() => { });
            return targetDb;
        } catch { }
        return preferredDb || 'mesdb';
    };

    public disableConstraints = async (targetEngine: string, targetConfig?: EngineConnectionConfig): Promise<void> => {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(targetEngine, targetConfig);

        if (targetEngine === 'oracle') {
            const user = conf.username || 'mesuser';
            const pass = conf.password || 'mespassword';
            const db = conf.database || 'FREEPDB1';
            const plsql = `BEGIN FOR c IN (SELECT table_name, constraint_name FROM user_constraints WHERE constraint_type = 'R') LOOP BEGIN EXECUTE IMMEDIATE 'ALTER TABLE "' || c.table_name || '" DISABLE CONSTRAINT "' || c.constraint_name || '"'; EXCEPTION WHEN OTHERS THEN NULL; END; END LOOP; END;\n/\nEXIT;\n`;
            const b64 = Buffer.from(plsql).toString('base64');
            await execAsync(`kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`).catch(() => { });
        }

        if (targetEngine === 'mssql') {
            const user = conf.username || 'sa';
            const pass = conf.password || 'MesStrongPass123!';
            const db = await this.resolveMssqlDb(k8sFlag, user, pass, conf.database);
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "USE [${db}]; EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';"`).catch(() => { });
        }
    };

    public enableConstraints = async (targetEngine: string, targetConfig?: EngineConnectionConfig): Promise<void> => {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(targetEngine, targetConfig);

        if (targetEngine === 'oracle') {
            const user = conf.username || 'mesuser';
            const pass = conf.password || 'mespassword';
            const db = conf.database || 'FREEPDB1';
            const plsql = `BEGIN FOR c IN (SELECT table_name, constraint_name FROM user_constraints WHERE constraint_type = 'R') LOOP BEGIN EXECUTE IMMEDIATE 'ALTER TABLE "' || c.table_name || '" ENABLE NOVALIDATE CONSTRAINT "' || c.constraint_name || '"'; EXCEPTION WHEN OTHERS THEN NULL; END; END LOOP; END;\n/\nEXIT;\n`;
            const b64 = Buffer.from(plsql).toString('base64');
            await execAsync(`kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`).catch(() => { });
        }

        if (targetEngine === 'mssql') {
            const user = conf.username || 'sa';
            const pass = conf.password || 'MesStrongPass123!';
            const db = await this.resolveMssqlDb(k8sFlag, user, pass, conf.database);
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "USE [${db}]; EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all';"`).catch(() => { });
        }
    };

    public discoverSourceTables = async (engine: string, config?: EngineConnectionConfig): Promise<string[]> => {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(engine, config);
        let foundTables: string[] = [];

        if (engine === 'mssql') {
            try {
                const user = conf.username || 'sa';
                const pass = conf.password || 'MesStrongPass123!';
                const db = await this.resolveMssqlDb(k8sFlag, user, pass, conf.database);
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "SET NOCOUNT ON; USE [${db}]; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN ('sysdiagrams') ORDER BY TABLE_NAME;" -h -1 -W`;
                const { stdout } = await execAsync(cmd, { timeout: 8000 });
                foundTables = stdout
                    .split(/\r?\n/)
                    .map(t => t.trim())
                    .filter(t => t && !t.includes('Changed database context') && !t.startsWith('('));
            } catch (err) {
                console.warn('[DataSyncService] MSSQL tábla-felfedezés hiba:', (err as any)?.message || err);
            }
        }

        if (engine === 'postgres') {
            const user = conf.username || 'postgres';
            const pass = conf.password || 'VnUH22Refo';
            const db = await this.resolvePostgresDb(k8sFlag, user, pass, conf.database);
            try {
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"`;
                const { stdout } = await execAsync(cmd, { timeout: 8000 });
                foundTables = stdout.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
            } catch (err) {
                console.warn('[DataSyncService] Postgres tábla-felfedezés hiba:', (err as any)?.message || err);
            }
        }

        if (engine === 'oracle') {
            try {
                const user = conf.username || 'mesuser';
                const pass = conf.password || 'mespassword';
                const db = conf.database || 'FREEPDB1';
                const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "printf 'SET PAGESIZE 0\\nSET FEEDBACK OFF\\nSELECT lower(table_name) FROM user_tables ORDER BY table_name;\\nEXIT;\\n' | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`;
                const { stdout } = await execAsync(cmd, { timeout: 8000 });
                foundTables = stdout.split(/\r?\n/).map(t => t.trim().toLowerCase()).filter(Boolean);
            } catch (err) {
                console.warn('[DataSyncService] Oracle tábla-felfedezés hiba:', (err as any)?.message || err);
            }
        }

        const TABLE_PRIORITY: Record<string, number> = {
            roles: 1,
            users: 2,
            products: 3,
            machines: 4,
            user_roles: 5,
            bom_items: 6,
            inventories: 7,
            work_orders: 8,
            machine_maintenance: 9,
            machine_telemetry: 10,
            notifications: 11,
            audit_logs: 12,
            factory_orders: 13,
            databasechangelog: 14,
            databasechangeloglock: 15
        };

        return foundTables.sort((a, b) => {
            const prioA = TABLE_PRIORITY[a.toLowerCase()] ?? 50;
            const prioB = TABLE_PRIORITY[b.toLowerCase()] ?? 50;
            return prioA - prioB;
        });
    };

    public discoverColumns = async (engine: string, tableName: string, config?: EngineConnectionConfig): Promise<ColumnDefinition[]> => {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(engine, config);

        if (engine === 'mssql') {
            try {
                const user = conf.username || 'sa';
                const pass = conf.password || 'MesStrongPass123!';
                const db = await this.resolveMssqlDb(k8sFlag, user, pass, conf.database);
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
            } catch { }
        }

        if (engine === 'postgres') {
            try {
                const user = conf.username || 'postgres';
                const pass = conf.password || 'VnUH22Refo';
                const db = await this.resolvePostgresDb(k8sFlag, user, pass, conf.database);
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
            } catch { }
        }

        if (engine === 'oracle') {
            try {
                const user = conf.username || 'mesuser';
                const pass = conf.password || 'mespassword';
                const db = conf.database || 'FREEPDB1';
                const sql = `SELECT lower(column_name) || '|' || lower(data_type) || '|' || data_length || '|' || nullable || '|' || (CASE WHEN identity_column = 'YES' THEN '1' ELSE '0' END) FROM user_tab_cols WHERE table_name = '${tableName.toUpperCase()}';`;
                const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "printf 'SET PAGESIZE 0\\nSET FEEDBACK OFF\\n${sql}\\nEXIT;\\n' | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`;
                const { stdout } = await execAsync(cmd, { timeout: 8000 });
                return stdout.split(/\r?\n/)
                    .map(l => l.trim())
                    .filter(l => l && l.includes('|'))
                    .map(line => {
                        const [name, dataType, maxLen, isNull, isIdent] = line.split('|');
                        return {
                            name: (name || '').toLowerCase(),
                            dataType: (dataType || 'varchar2').toLowerCase(),
                            maxLength: maxLen ? parseInt(maxLen, 10) : null,
                            isNullable: isNull === 'Y',
                            isIdentity: isIdent === '1'
                        };
                    });
            } catch { }
        }

        return [];
    };

    public ensureTargetTableSchema = async (
        targetEngine: string,
        tableName: string,
        columns: ColumnDefinition[],
        targetConfig?: EngineConnectionConfig
    ): Promise<void> => {
        if (!columns || columns.length === 0) return;
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(targetEngine, targetConfig);

        // 1. Cél: PostgreSQL
        if (targetEngine === 'postgres') {
            const user = conf.username || 'postgres';
            const pass = conf.password || 'VnUH22Refo';
            const db = await this.resolvePostgresDb(k8sFlag, user, pass, conf.database);

            const getPgType = (c: ColumnDefinition) => {
                const dt = c.dataType.toLowerCase();
                if (dt.includes('uuid') || dt.includes('uniqueidentifier') || (c.maxLength && c.maxLength === 36)) return 'UUID';
                if (dt.includes('int') || dt.includes('smallint') || dt.includes('bigint')) return 'BIGINT';
                if (dt.includes('bool') || dt.includes('bit')) return 'BOOLEAN';
                if (dt.includes('date') || dt.includes('time')) return 'TIMESTAMP';
                if (dt.includes('decimal') || dt.includes('numeric') || dt.includes('float') || dt.includes('real')) return 'NUMERIC(19,4)';
                if (c.maxLength && c.maxLength > 0 && c.maxLength < 1000) return `VARCHAR(${c.maxLength})`;
                return 'TEXT';
            };

            const colDefs = columns.map(c => `"${c.name.toLowerCase()}" ${getPgType(c)}`).join(', ');
            const createSql = `CREATE TABLE IF NOT EXISTS "${tableName.toLowerCase()}" (${colDefs});`;

            const dbsToUpdate = [db];
            if (db === 'mes_db') dbsToUpdate.push('mesdb');
            if (db === 'mesdb') dbsToUpdate.push('mes_db');

            for (const targetDb of Array.from(new Set(dbsToUpdate))) {
                await execAsync(`kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${targetDb} -c "${createSql}"`).catch(() => { });
                for (const c of columns) {
                    const alterSql = `ALTER TABLE "${tableName.toLowerCase()}" ADD COLUMN IF NOT EXISTS "${c.name.toLowerCase()}" ${getPgType(c)};`;
                    await execAsync(`kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${targetDb} -d ${targetDb} -c "${alterSql}"`).catch(() => { });
                }
            }
        }

        // 2. Cél: MSSQL
        if (targetEngine === 'mssql') {
            const user = conf.username || 'sa';
            const pass = conf.password || 'MesStrongPass123!';
            const db = await this.resolveMssqlDb(k8sFlag, user, pass, conf.database);

            const getMsType = (c: ColumnDefinition) => {
                const dt = c.dataType.toLowerCase();
                if (dt.includes('uuid') || dt.includes('uniqueidentifier') || (c.maxLength && c.maxLength === 36)) return 'VARCHAR(36)';
                if (dt.includes('int') || dt.includes('smallint')) return 'BIGINT';
                if (dt.includes('bool') || dt.includes('bit')) return 'BIT';
                if (dt.includes('date') || dt.includes('time')) return 'DATETIME2';
                if (dt.includes('decimal') || dt.includes('numeric') || dt.includes('float') || dt.includes('real')) return 'DECIMAL(19,4)';
                if (c.maxLength && c.maxLength > 0 && c.maxLength < 1000) return `NVARCHAR(${c.maxLength})`;
                return 'NVARCHAR(MAX)';
            };

            const colDefs = columns.map(c => `[${c.name.toLowerCase()}] ${getMsType(c)}`).join(', ');
            let fullMssql = `USE [${db}]; IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${tableName}') CREATE TABLE [${tableName}] (${colDefs});\n`;
            for (const c of columns) {
                fullMssql += `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${tableName}]') AND name = '${c.name.toLowerCase()}') ALTER TABLE [${tableName}] ADD [${c.name.toLowerCase()}] ${getMsType(c)} NULL;\n`;
            }

            const b64 = Buffer.from(fullMssql).toString('base64');
            await execAsync(`kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- bash -c "echo '${b64}' | base64 -d | /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P '${pass}' -C"`).catch(() => { });
        }

        // 3. Cél: Oracle
        if (targetEngine === 'oracle') {
            const user = conf.username || 'mesuser';
            const pass = conf.password || 'mespassword';
            const db = conf.database || 'FREEPDB1';

            const getOraType = (c: ColumnDefinition) => {
                const dt = c.dataType.toLowerCase();
                if (dt.includes('uuid') || dt.includes('uniqueidentifier') || (c.maxLength && c.maxLength === 36)) return 'VARCHAR2(36)';
                if (dt.includes('int') || dt.includes('number') || dt.includes('smallint')) return 'NUMBER';
                if (dt.includes('bool') || dt.includes('bit')) return 'NUMBER(1)';
                if (dt.includes('date') || dt.includes('time')) return 'TIMESTAMP';
                if (dt.includes('decimal') || dt.includes('numeric') || dt.includes('float') || dt.includes('real') || dt.includes('double') || dt.includes('precision')) return 'NUMBER(19,4)';
                if (c.maxLength && c.maxLength > 0 && c.maxLength <= 4000) return `VARCHAR2(${c.maxLength})`;
                if (dt.includes('char') || dt.includes('text')) return 'VARCHAR2(4000)';
                return 'CLOB';
            };

            const colDefs = columns.map(c => `"${c.name.toUpperCase()}" ${getOraType(c)}`).join(', ');

            const createSql = `BEGIN EXECUTE IMMEDIATE 'DROP TABLE "${tableName.toUpperCase()}" CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;\n/\nBEGIN EXECUTE IMMEDIATE 'CREATE TABLE "${tableName.toUpperCase()}" (${colDefs})'; END;\n/\nCOMMIT;\nEXIT;\n`;
            const b64 = Buffer.from(createSql).toString('base64');
            await execAsync(`kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`).catch(() => { });
        }
    };

    public extractTableData = async (engine: string, tableName: string, config?: EngineConnectionConfig): Promise<any[]> => {
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(engine, config);
        const execOptions = { timeout: 120000, maxBuffer: 100 * 1024 * 1024 };

        const normalizeRows = (rawRows: any[]): any[] => {
            if (!Array.isArray(rawRows)) return [];
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return rawRows.map(r => {
                if (!r || typeof r !== 'object') return r;
                const normalized: Record<string, any> = {};
                for (const [k, v] of Object.entries(r)) {
                    let val = v;
                    if (typeof val === 'string' && uuidRegex.test(val)) {
                        val = val.toLowerCase();
                    }
                    normalized[k.toLowerCase()] = val;
                }
                return normalized;
            });
        };

        if (engine === 'mssql') {
            try {
                const user = conf.username || 'sa';
                const pass = conf.password || 'MesStrongPass123!';
                const db = await this.resolveMssqlDb(k8sFlag, user, pass, conf.database);
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra deployment/mssql -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U ${user} -P "${pass}" -C -Q "SET NOCOUNT ON; USE [${db}]; SELECT * FROM [${tableName}] FOR JSON PATH;" -y 0`;
                const { stdout } = await execAsync(cmd, execOptions);
                const lines = stdout
                    .split(/\r?\n/)
                    .filter(line => !line.startsWith('Changed database') && !line.startsWith('('));
                const jsonText = lines.join('').trim();
                if (!jsonText || jsonText === '[]') return [];
                return normalizeRows(JSON.parse(jsonText));
            } catch (err) {
                console.warn(`[DataSyncService] MSSQL extract error on table ${tableName}:`, (err as any)?.message || err);
                return [];
            }
        }

        if (engine === 'postgres') {
            try {
                const user = conf.username || 'postgres';
                const pass = conf.password || 'VnUH22Refo';
                const db = await this.resolvePostgresDb(k8sFlag, user, pass, conf.database);
                const cmd = `kubectl ${k8sFlag} exec -n platform-infra postgres-postgresql-ha-postgresql-0 -- env PGPASSWORD=${pass} psql -U ${user} -d ${db} -t -A -c "SELECT COALESCE(json_agg(t), '[]'::json) FROM (SELECT * FROM \\"${tableName}\\") t;"`;
                const { stdout } = await execAsync(cmd, execOptions);
                const jsonText = stdout.trim();
                if (!jsonText || jsonText === '[]') return [];
                return normalizeRows(JSON.parse(jsonText));
            } catch (err) {
                console.warn(`[DataSyncService] Postgres extract error on table ${tableName}:`, (err as any)?.message || err);
                return [];
            }
        }

        if (engine === 'oracle') {
            try {
                const user = conf.username || 'mesuser';
                const pass = conf.password || 'mespassword';
                const db = conf.database || 'FREEPDB1';
                const plsql = `SET LONG 2000000000\nSET LONGCHUNKSIZE 65535\nSET PAGESIZE 0\nSET FEEDBACK OFF\nSET LINESIZE 32767\nSELECT COALESCE(json_arrayagg(json_object(* RETURNING CLOB) RETURNING CLOB), TO_CLOB('[]')) FROM "${tableName.toUpperCase()}";\nEXIT;\n`;
                const b64 = Buffer.from(plsql).toString('base64');
                const cmd = `kubectl ${k8sFlag} exec -i -n platform-infra deployment/oracle -- bash -c "echo '${b64}' | base64 -d | sqlplus -s ${user}/${pass}@localhost:1521/${db}"`;
                const { stdout } = await execAsync(cmd, execOptions);
                const lines = stdout
                    .split(/\r?\n/)
                    .map(l => l.trim())
                    .filter(l => l && !l.startsWith('SQL>') && !l.startsWith('Connected') && !l.startsWith('Disconnected'));
                const jsonText = lines.join('').trim();
                if (!jsonText || jsonText === '[]') return [];
                return normalizeRows(JSON.parse(jsonText));
            } catch (err) {
                console.warn(`[DataSyncService] Oracle extract error on table ${tableName}:`, (err as any)?.message || err);
                return [];
            }
        }

        return [];
    };

    public loadTableData = async (
        targetEngine: string,
        tableName: string,
        rows: any[],
        columns: ColumnDefinition[],
        targetConfig?: EngineConnectionConfig
    ): Promise<number> => {
        if (!rows || rows.length === 0) return 0;
        const k8sFlag = this.getK8sServerFlag();
        const conf = this.normalizeConfig(targetEngine, targetConfig);
        const rowKeys = Object.keys(rows[0]).map(k => k.toLowerCase());

        // 1. Cél: PostgreSQL
        if (targetEngine === 'postgres') {
            try {
                const user = conf.username || 'postgres';
                const pass = conf.password || 'VnUH22Refo';
                const db = await this.resolvePostgresDb(k8sFlag, user, pass, conf.database);
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
                                const v = row[c];
                                if (v === null || v === undefined) return 'NULL';
                                const colDef = columns.find(cd => cd.name.toLowerCase() === c);
                                const isBool = colDef?.dataType?.toLowerCase().includes('bool') || colDef?.dataType?.toLowerCase().includes('bit') || c === 'active' || c === 'deleted' || typeof v === 'boolean';
                                if (isBool) {
                                    if (v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true') return "'true'";
                                    if (v === false || v === 0 || v === '0' || String(v).toLowerCase() === 'false') return "'false'";
                                    return 'NULL';
                                }
                                if (typeof v === 'number') return String(v);
                                const strVal = String(v).replace(/'/g, "''");
                                return `'${strVal}'`;
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
            } catch (err) {
                console.warn(`[DataSyncService] Postgres betöltési hiba (${tableName}):`, (err as any)?.message || err);
                return 0;
            }
        }

        // 2. Cél: MSSQL
        if (targetEngine === 'mssql') {
            try {
                const user = conf.username || 'sa';
                const pass = conf.password || 'MesStrongPass123!';
                const db = await this.resolveMssqlDb(k8sFlag, user, pass, conf.database);
                const colNames = rowKeys.map(c => `[${c.toLowerCase()}]`).join(', ');
                const hasIdentity = columns.some(c => c.isIdentity);
                const batchSize = 100;

                let fullSql = `USE [${db}]; ALTER TABLE [${tableName}] NOCHECK CONSTRAINT ALL; DELETE FROM [${tableName}];\n`;

                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    const valuesList = batch.map(row => {
                        const vals = rowKeys.map(c => {
                            const v = row[c];
                            if (v === null || v === undefined) return 'NULL';
                            const colDef = columns.find(cd => cd.name.toLowerCase() === c);
                            const isBool = colDef?.dataType?.toLowerCase().includes('bool') || colDef?.dataType?.toLowerCase().includes('bit') || c === 'active' || c === 'deleted' || typeof v === 'boolean';
                            if (isBool) {
                                if (v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true') return '1';
                                if (v === false || v === 0 || v === '0' || String(v).toLowerCase() === 'false') return '0';
                                return 'NULL';
                            }
                            if (typeof v === 'number') return String(v);
                            const strVal = String(v).replace(/'/g, "''");
                            return `'${strVal}'`;
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
                } finally {
                    if (fs.existsSync(tempSqlFile)) fs.unlinkSync(tempSqlFile);
                }
                return rows.length;
            } catch (err) {
                console.warn(`[DataSyncService] MSSQL betöltési hiba (${tableName}):`, (err as any)?.message || err);
                return 0;
            }
        }

        // 3. Cél: Oracle
        if (targetEngine === 'oracle') {
            try {
                const user = conf.username || 'mesuser';
                const pass = conf.password || 'mespassword';
                const db = conf.database || 'FREEPDB1';

                const colNames = rowKeys.map(c => `"${c.toUpperCase()}"`).join(', ');

                // Törlés
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
                            const v = row[c];
                            if (v === null || v === undefined) return 'NULL';
                            const colDef = columns.find(cd => cd.name.toLowerCase() === c);
                            const isBool = colDef?.dataType?.toLowerCase().includes('bool') || colDef?.dataType?.toLowerCase().includes('bit') || c === 'active' || c === 'deleted' || typeof v === 'boolean';
                            if (isBool) {
                                if (v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true') return '1';
                                if (v === false || v === 0 || v === '0' || String(v).toLowerCase() === 'false') return '0';
                                return 'NULL';
                            }
                            if (typeof v === 'number') return String(v);
                            const strVal = String(v).replace(/'/g, "''");
                            const isIsoDate = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(v);
                            if (isIsoDate) {
                                const cleanDate = v.replace('T', ' ').substring(0, 19);
                                return `TO_TIMESTAMP('${cleanDate}', 'YYYY-MM-DD HH24:MI:SS')`;
                            }
                            return `'${strVal}'`;
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
            } catch (err) {
                console.warn(`[DataSyncService] Oracle betöltési hiba (${tableName}):`, (err as any)?.message || err);
                return 0;
            }
        }

        return 0;
    };

    public syncAllTables = async (
        sourceEngine: string,
        targetEngine: string,
        sourceConfig?: EngineConnectionConfig,
        targetConfig?: EngineConnectionConfig,
        onProgress?: (tableName: string, tablesMigrated: number, totalTables: number, rowsCopied: number) => Promise<void>
    ): Promise<SyncProgressResult> => {
        const normSource = this.normalizeConfig(sourceEngine, sourceConfig);
        const normTarget = this.normalizeConfig(targetEngine, targetConfig);

        // 1. Dinamikus táblafelderítés rendezett prioritással (szülő táblák először)
        const tables = await this.discoverSourceTables(sourceEngine, normSource);
        if (tables.length === 0) {
            console.warn(`[DataSyncService] Nem található egyetlen tábla sem a forrás (${sourceEngine}) adatbázisban.`);
            return { totalTables: 0, totalRows: 0 };
        }

        // 2. Megszorítások globális kikapcsolása a cél adatbázisban az adatbetöltés idejére
        await this.disableConstraints(targetEngine, normTarget);

        let totalRowsCopied = 0;
        let tablesMigrated = 0;
        const totalTables = tables.length;

        try {
            for (const tableName of tables) {
                try {
                    // Dinamikus oszlop- és sémafelderítés
                    const columns = await this.discoverColumns(sourceEngine, tableName, normSource);
                    if (columns.length > 0) {
                        await this.ensureTargetTableSchema(targetEngine, tableName, columns, normTarget);
                    }

                    // Dinamikus adatkinyerés
                    const rows = await this.extractTableData(sourceEngine, tableName, normSource);

                    // Dinamikus adatbetöltés
                    if (rows.length > 0) {
                        const loaded = await this.loadTableData(targetEngine, tableName, rows, columns, normTarget);
                        totalRowsCopied += loaded;
                    }
                    tablesMigrated++;

                    if (onProgress) {
                        await onProgress(tableName, tablesMigrated, totalTables, totalRowsCopied);
                    }
                } catch (err) {
                    console.warn(`[DataSyncService] Hiba a(z) ${tableName} szinkronizációjakor:`, (err as any)?.message || err);
                    tablesMigrated++;
                    if (onProgress) {
                        await onProgress(tableName, tablesMigrated, totalTables, totalRowsCopied);
                    }
                }
            }
        } finally {
            // 3. Megszorítások visszakapcsolása
            await this.enableConstraints(targetEngine, normTarget).catch(() => { });
        }

        return {
            totalTables,
            totalRows: totalRowsCopied
        };
    };
}

