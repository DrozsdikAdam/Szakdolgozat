export type GitProvider = 'GITHUB' | 'GITLAB';

export type DatabaseMode = 'internal' | 'external';
export type DatabaseEngine = 'postgres' | 'mssql' | 'oracle';

export type S3Provider = "internal" | 'external';
export type InstanceSize = 'nano' | 'small' | 'medium' | 'large';

export type SystemConfigKey = 'is_initialized'
    | 'git_provider'
    | 'repo_url'
    | 'db_mode'
    | 'db_engine'
    | 's3_provider'
    | 's3_bucket'
    | 's3_bucket_size'
    | 'instance_size'
    | 'inactivation_strategy'
    | 'db_host'
    | 'db_port'
    | 'db_name'
    | 'db_user'
    | 'db_replicas'
    | 'db_pool_size'
    | 'db_cutover_job'
    | 'db_cutover_scheduled_at'
    | 'storage_mode'
    | 'storage_internal_size_gb'
    | 'storage_external_endpoint'
    | 'storage_external_bucket'
    | 'storage_external_region'
    | 'storage_external_access_key'
    | 'storage_external_secret_key'
    | 'storage_scale_down_internal';