import type { ReactNode } from "react"

export type ServiceId = 'cluster'
    | 'traffic'
    | 'autoscaling'
    | 'backup'
    | 'features'
    | 'audit'
    | 'setup'
    | 'events'
    | 'configs'
    | 'health'
    | 'deployments'
    | 'telemetry'

export interface ServiceItem {
    id: ServiceId
    label: string
    description: string
    iconName: ReactNode
    badgeText: string
    badgeVariant: 'teal' | 'vermillon' | 'orange' | 'skyblue' | 'purple'
    accentColor: string
    isConfigured: boolean
    statusLabel?: string
    statusVariant?: 'teal' | 'orange' | 'vermillon' | 'skyblue'
}