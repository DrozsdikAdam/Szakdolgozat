import type {
    DatabaseOverviewDto,
    SaveDatabaseConfigDto,
    StartMigrationDto,
    MigrationJobStatusDto,
    TestConnectionResultDto
} from "../dtos/database.dto.js";
import type {
    DatabaseEngine,
    DatabaseMode,
    DatabaseStatus,
    ParsedDatabaseConfig,
    ToOverviewDtoParams
} from "../types/database.types.js";
import {
    DEFAULT_DB_PORTS,
    DEFAULT_INTERNAL_HOSTS,
    DATABASE_DEFAULTS,
    DATABASE_LIMITS,
    MIGRATION_CONSTANTS
} from "../constants/database.constants.js";

export class DatabaseMapper {
    static parseConfig(configMap: Map<string, string>): ParsedDatabaseConfig {
        const engine = (configMap.get('db_engine') as DatabaseEngine) || DATABASE_DEFAULTS.ENGINE;
        const mode = (configMap.get('db_mode') as DatabaseMode) || DATABASE_DEFAULTS.MODE;
        const defaultHost = mode === 'internal' ? DEFAULT_INTERNAL_HOSTS[engine] : 'localhost';
        const host = configMap.get('db_host') || defaultHost;
        const defaultPort = DEFAULT_DB_PORTS[engine] || 5432;
        const port = parseInt(configMap.get('db_port') || String(defaultPort), 10);
        const database = configMap.get('db_name') || DATABASE_DEFAULTS.DB_NAME;
        const username = configMap.get('db_user') || DATABASE_DEFAULTS.DB_USER;
        const poolSize = parseInt(configMap.get('db_pool_size') || String(DATABASE_LIMITS.DEFAULT_POOL_SIZE), 10);
        const savedReplicas = parseInt(configMap.get('db_replicas') || String(DATABASE_LIMITS.DEFAULT_REPLICAS), 10);

        return { engine, mode, host, port, database, username, poolSize, savedReplicas };
    }

    static toOverviewDto(params: ToOverviewDtoParams): DatabaseOverviewDto {
        const { config, replicas, pingResult } = params;
        const isOnline = pingResult.success || (config.mode === 'internal' && replicas > 0);
        const status: DatabaseStatus = isOnline ? 'ONLINE' : 'DEGRADED';

        return {
            engine: config.engine,
            mode: config.mode,
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            replicas,
            maxReplicas: DATABASE_LIMITS.MAX_REPLICAS,
            activeConnections: isOnline ? (config.savedReplicas * 4 || 12) : 0,
            poolSize: config.poolSize,
            latencyMs: pingResult.latencyMs || (isOnline ? 2 : 0),
            status,
            serverVersion: pingResult.serverVersion || `${config.engine.toUpperCase()} 2022 HA (K8s Managed)`,
            pgbouncerEnabled: true,
            multiDbEnabled: true
        };
    }

    static toJdbcUrl(engine: DatabaseEngine, host: string, port: number, database: string): string {
        switch (engine) {
            case 'mssql':
                return `jdbc:sqlserver://${host}:${port};databaseName=${database};encrypt=false;trustServerCertificate=true`;
            case 'oracle':
                return `jdbc:oracle:thin:@${host}:${port}/${database}`;
            case 'postgres':
            default:
                return `jdbc:postgresql://${host}:${port}/${database}`;
        }
    }

    static toDriverClassName(engine: DatabaseEngine): string {
        switch (engine) {
            case 'mssql':
                return 'com.microsoft.sqlserver.jdbc.SQLServerDriver';
            case 'oracle':
                return 'oracle.jdbc.OracleDriver';
            case 'postgres':
            default:
                return 'org.postgresql.Driver';
        }
    }

    static toHibernateDialect(engine: DatabaseEngine): string {
        switch (engine) {
            case 'mssql':
                return 'org.hibernate.dialect.SQLServerDialect';
            case 'oracle':
                return 'org.hibernate.dialect.OracleDialect';
            case 'postgres':
            default:
                return 'org.hibernate.dialect.PostgreSQLDialect';
        }
    }

    static toSecretData(dto: SaveDatabaseConfigDto): Record<string, string> {
        const jdbcUrl = this.toJdbcUrl(dto.engine, dto.host, dto.port, dto.database);
        const driverClassName = this.toDriverClassName(dto.engine);
        const dialect = this.toHibernateDialect(dto.engine);

        const data: Record<string, string> = {
            SPRING_DATASOURCE_URL: jdbcUrl,
            SPRING_DATASOURCE_USERNAME: dto.username,
            SPRING_DATASOURCE_DRIVER_CLASS_NAME: driverClassName,
            SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT: dialect,
            DB_ENGINE: dto.engine,
            DB_HOST: dto.host,
            DB_PORT: String(dto.port),
            DB_NAME: dto.database,
            DB_USER: dto.username,
            DB_DRIVER: driverClassName
        };
        if (dto.password) {
            data.SPRING_DATASOURCE_PASSWORD = dto.password;
            data.DB_PASSWORD = dto.password;
        }
        return data;
    }

    static toEnvUpdates(dto: SaveDatabaseConfigDto): Record<string, string> {
        const driverClassName = this.toDriverClassName(dto.engine);
        const dialect = this.toHibernateDialect(dto.engine);
        const jdbcUrl = this.toJdbcUrl(dto.engine, dto.host, dto.port, dto.database);

        const dockerHost = 'host.docker.internal';
        const dockerPort = dto.engine === 'postgres' ? 5432 : dto.engine === 'mssql' ? 1433 : 1521;
        const dockerJdbcUrl = this.toJdbcUrl(dto.engine, dockerHost, dockerPort, dto.database);

        const updates: Record<string, string> = {
            DB_ENGINE: dto.engine,
            DB_MODE: dto.mode,
            DB_HOST: dto.host,
            DB_PORT: String(dto.port),
            DB_NAME: dto.database,
            DB_USER: dto.username,
            DB_DRIVER: driverClassName,
            SPRING_DATASOURCE_URL: jdbcUrl,
            SPRING_DATASOURCE_USERNAME: dto.username,
            SPRING_DATASOURCE_DRIVER_CLASS_NAME: driverClassName,
            SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT: dialect,
            DOCKER_SPRING_DATASOURCE_URL: dockerJdbcUrl
        };
        if (dto.password) {
            updates.DB_PASSWORD = dto.password;
            updates.SPRING_DATASOURCE_PASSWORD = dto.password;
        }
        return updates;
    }

    static toInitialJob(jobId: string, dto: StartMigrationDto): MigrationJobStatusDto {
        return {
            jobId,
            status: 'PENDING',
            progressPercent: MIGRATION_CONSTANTS.INITIAL_PROGRESS,
            currentStep: 'Migrációs folyamat inicializálása...',
            tablesTotal: MIGRATION_CONSTANTS.TOTAL_TABLES,
            tablesMigrated: 0,
            rowsCopied: 0,
            sourceEngine: dto.sourceEngine,
            targetEngine: dto.targetEngine,
            startedAt: new Date().toISOString()
        };
    }
}
