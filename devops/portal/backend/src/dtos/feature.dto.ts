import type { FeatureFlagName } from "../types/feature.types.js"

export interface FeatureTogglePayload {
    name: FeatureFlagName
    enabled: boolean
    params?: Record<string, unknown>
}