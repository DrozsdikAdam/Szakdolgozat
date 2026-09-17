import type { InstanceSize } from "./component/setup/setupDataProps"

export type GitProvider = 'GITHUB' | 'GITLAB'

export type DatabaseMode = 'internal' | 'external'
export type DatabaseEngine = 'postgres' | 'mssql' | 'oracle'

export type S3Provider = 'internal' | 'external'

export type FeatureFlagName = 'rate_limiting' | 'pgbouncer' | 'haproxy' | 'cronjob_backup' | 'hpa_scaling' | 'vpa_scaling' | 'maintenance_mode'

export type InactivationStrategy = 'scale_to_zero' | 'hot_standby'

export interface PlatformStatusResponse {
    isInitialized: boolean,
    gitProvider?: GitProvider,
    repoUrl?: string,
    dbEngine?: DatabaseEngine,
    dbMode?: DatabaseMode,
    s3Provider?: S3Provider,
    inactivationStrategy?: InactivationStrategy,
    activeFeatures: Record<FeatureFlagName, boolean>,
    featureParams?: Partial<Record<FeatureFlagName, Record<string, any>>>
}

export interface FeatureTogglePayload {
    name: FeatureFlagName;
    enabled: boolean;
    params?: Record<string, unknown>;
    strategy: InactivationStrategy;
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
    instanceSize?: InstanceSize,
    inactivationStrategy: InactivationStrategy,
    enabledFeatures: FeatureFlagName[]
}