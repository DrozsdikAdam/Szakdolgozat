import type { FeatureFlagName, InactivationStrategy } from "../types/feature.types.js"
import type { DatabaseEngine, DatabaseMode, GitProvider, InstanceSize, S3Provider } from "../types/setup.types.js"

export interface PlatformStatusResponse {

    isInitialized: boolean
    gitProvider?: GitProvider
    repoUrl?: string
    dbEngine?: DatabaseEngine
    dbMode?: DatabaseMode
    s3Provider?: S3Provider
    instanceSize?: InstanceSize
    activeFeatures: Record<FeatureFlagName, boolean>
    inactivationStrategy?: InactivationStrategy

}