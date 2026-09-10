import type { DatabaseMode, GitProvider, S3Provider } from "../types/setup.types.js"

export interface SetupWizardPayload {
    gitProvider: GitProvider
    repoUrl: string
    webhookSecret?: string
    dbMode: DatabaseMode
    dbConnectionString?: string
    s3Provider: S3Provider
    s3Endpoint?: string
    s3Bucket?: string
    s3BucketSize?: string
    s3AccessKey?: string
    s3SecretKey?: string
    enabledFeatures: string[]
}
