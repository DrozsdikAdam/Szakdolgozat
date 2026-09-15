export type GitProvider = 'GITHUB' | 'GITLAB'

export type DatabaseMode = 'internal' | 'external'
export type DatabaseEngine = 'postgres' | 'mssql' | 'oracle'

export type S3Provider = 'internal' | 'external'

export type FeatureFlagName = 'rate_limiting' | 'pgbouncer' | 'haproxy' | 'cronjob_backup' | 'hpa_scaling' | 'vpa_scaling' | 'maintenance_mode'

export interface PlatformStatusResponse {
    isInitialized: boolean,
    gitProvider?: GitProvider,
    repoUrl?: string,
    dbEngine?: DatabaseEngine,
    dbMode?: DatabaseMode,
    s3Provider?: S3Provider,
    activeFeatures: Record<FeatureFlagName, boolean>
}

export interface FeatureTogglePayload {
    name: FeatureFlagName;
    enabled: boolean;
    params?: Record<string, unknown>;
}


export interface SetupWizardPayload {
    gitProvider: GitProvider,
    repoUrl: string,
    webhookSecret?: string,
    dbEngine?: DatabaseEngine,
    dbMode: DatabaseMode,
    s3Provider: S3Provider,
    s3Bucket?: string,
    s3BucketSize?: string,
    enabledFeatures: FeatureFlagName[]
}