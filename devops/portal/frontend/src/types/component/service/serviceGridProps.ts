import type { ServiceId, ServiceItem } from "../hub"

export type ServiceFilter = 'all' | 'configured' | 'pending'

export interface ServiceGridProps {
    services: ServiceItem[]
    onSelectService: (id: ServiceId) => void
    selectedServiceId?: ServiceId | null
}
