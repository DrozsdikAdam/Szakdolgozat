export type GitProvider = 'GITHUB' | 'GITLAB';

export type DatabaseMode = 'internal' | 'external';
export type DatabaseEngine = 'postgres' | 'mssql' | 'oracle';

export type S3Provider = "internal" | 'external';

export type SystemConfigKey = 'is_initialized'
    | 'git_provider'
    | 'repo_url'
    | 'db_mode'
    | 'db_engine'
    | 's3_provider'
    | 's3_bucket'
    | 's3_bucket_size'