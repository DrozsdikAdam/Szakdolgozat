import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { DEFAULT_INTERNAL_HOSTS, DEFAULT_INTERNAL_CREDENTIALS } from "../../../constants/database.constants.js";
import type { DatabaseSyncAdapter, EngineConnectionConfig, ColumnDefinition, DatabaseStats, TableForeignKeyDependency } from "../types.js";

export const execAsync = promisify(exec);

export abstract class BaseSyncAdapter implements DatabaseSyncAdapter {
    abstract readonly engine: string;

    protected getK8sServerFlag(): string {
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
    }

    public normalizeConfig(config?: EngineConnectionConfig): EngineConnectionConfig {
        const engineKey = this.engine as keyof typeof DEFAULT_INTERNAL_CREDENTIALS;
        const defaults = DEFAULT_INTERNAL_CREDENTIALS[engineKey];
        if (!defaults) return config || {};

        const isInternal = !config || config.mode === 'internal' || (config.host && config.host.includes('.svc.cluster.local'));
        if (!isInternal) {
            return config || {};
        }

        return {
            host: config?.host && !config.host.includes('postgres-master') ? config.host : DEFAULT_INTERNAL_HOSTS[engineKey],
            port: config?.port || (this.engine === 'postgres' ? 5432 : this.engine === 'mssql' ? 1433 : 1521),
            database: defaults.database,
            username: defaults.username,
            password: defaults.password,
            mode: 'internal'
        };
    }

    protected topologicalSortTables(tables: string[], dependencies: TableForeignKeyDependency[] = []): string[] {
        const tableSet = new Set(tables.map(t => t.toLowerCase()));
        const inDegree = new Map<string, number>();
        const adjList = new Map<string, string[]>();

        for (const t of tableSet) {
            inDegree.set(t, 0);
            adjList.set(t, []);
        }

        for (const dep of dependencies) {
            const parent = dep.parentTable.toLowerCase();
            const child = dep.childTable.toLowerCase();
            if (tableSet.has(parent) && tableSet.has(child) && parent !== child) {
                adjList.get(parent)!.push(child);
                inDegree.set(child, (inDegree.get(child) || 0) + 1);
            }
        }

        const queue: string[] = [];
        for (const [t, deg] of inDegree.entries()) {
            if (deg === 0) queue.push(t);
        }

        const sorted: string[] = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            sorted.push(current);
            for (const neighbor of adjList.get(current) || []) {
                const nextDeg = (inDegree.get(neighbor) || 1) - 1;
                inDegree.set(neighbor, nextDeg);
                if (nextDeg === 0) {
                    queue.push(neighbor);
                }
            }
        }

        for (const t of tables) {
            const lower = t.toLowerCase();
            if (!sorted.includes(lower)) {
                sorted.push(lower);
            }
        }

        return sorted;
    }

    protected async sortTablesByDependency(tables: string[], config: EngineConnectionConfig): Promise<string[]> {
        try {
            const deps = await this.discoverForeignKeys(config);
            if (deps && deps.length > 0) {
                return this.topologicalSortTables(tables, deps);
            }
        } catch { }

        return this.topologicalSortTables(tables, []);
    }

    protected isBooleanValue(val: unknown, colDef?: ColumnDefinition, colName?: string): boolean {
        if (typeof val === 'boolean') return true;
        const dt = colDef?.dataType?.toLowerCase();
        if (dt && (dt.includes('bool') || dt.includes('bit'))) return true;
        const name = (colName || colDef?.name || '').toLowerCase();
        return name === 'active' || name === 'deleted';
    }

    protected normalizeExtractedRows(rawRows: any[]): any[] {
        if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return rawRows.map(r => {
            if (!r || typeof r !== 'object') return r;
            const normalized: Record<string, any> = {};
            for (const [k, v] of Object.entries(r)) {
                normalized[k.toLowerCase()] = (typeof v === 'string' && uuidRegex.test(v)) ? v.toLowerCase() : v;
            }
            return normalized;
        });
    }

    abstract discoverTables(config: EngineConnectionConfig): Promise<string[]>;
    abstract discoverColumns(tableName: string, config: EngineConnectionConfig): Promise<ColumnDefinition[]>;
    abstract discoverForeignKeys(config: EngineConnectionConfig): Promise<TableForeignKeyDependency[]>;
    abstract ensureTableSchema(tableName: string, columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<void>;
    abstract extractData(tableName: string, config: EngineConnectionConfig): Promise<any[]>;
    abstract loadData(tableName: string, rows: any[], columns: ColumnDefinition[], config: EngineConnectionConfig): Promise<number>;
    abstract disableConstraints(config: EngineConnectionConfig): Promise<void>;
    abstract enableConstraints(config: EngineConnectionConfig): Promise<void>;
    abstract getStats(config: EngineConnectionConfig): Promise<DatabaseStats>;
}
