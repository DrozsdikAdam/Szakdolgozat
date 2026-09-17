import type { ReactNode } from "react"
import type { FeatureFlagName, InactivationStrategy } from "../../platform"

export type FeatureCategory = 'traffic' | 'database' | 'scaling' | 'operations'

export interface FeatureMetaItem {
    key: FeatureFlagName
    label: string
    description: string
    category: FeatureCategory
    icon: ReactNode
    isCritical?: boolean
}

export interface FeatureCardProps {
    feature: FeatureMetaItem
    enabled: boolean
    isToggling: boolean
    strategy?: InactivationStrategy
    onToggle: (key: FeatureFlagName, nextState: boolean) => void
}