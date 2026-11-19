import type { FeatureFlagName, InactivationStrategy } from "../types/feature.types.js"

export interface FeatureTogglePayload {
    name: FeatureFlagName
    enabled: boolean
    strategy?: InactivationStrategy
    inactivationStrategy?: InactivationStrategy
    params?: Record<string, unknown>
}