import type { InactivationStrategy } from "../types/feature.types.js"
import type { DatabaseEngine, DatabaseMode, GitProvider, InstanceSize, S3Provider } from "../types/setup.types.js"

export interface SetupWizardPayload {
    gitProvider: GitProvider
    repoUrl: string
    webhookSecret?: string
    dbEngine?: DatabaseEngine
    dbMode: DatabaseMode
    dbConnectionString?: string
    s3Provider: S3Provider
    s3Endpoint?: string
    s3Bucket?: string
    s3BucketSize?: string
    s3AccessKey?: string
    s3SecretKey?: string
    instanceSize?: InstanceSize
    enabledFeatures: string[]
    inactivationStrategy: InactivationStrategy
}
