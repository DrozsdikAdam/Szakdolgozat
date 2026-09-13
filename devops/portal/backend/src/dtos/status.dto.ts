import type { FeatureFlagName } from "../types/feature.types.js"
import type { DatabaseMode, GitProvider, S3Provider } from "../types/setup.types.js"

export interface PlatformStatusResponse {

    isInitialized: boolean
    gitProvider?: GitProvider
    repoUrl?: string
    dbMode?: DatabaseMode
    s3Provider?: S3Provider
    activeFeatures: Record<FeatureFlagName, boolean>

}