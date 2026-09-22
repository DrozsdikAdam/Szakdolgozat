import type { ServiceId, ServiceItem } from "../hub";

export interface ServiceCardProps {
    service: ServiceItem
    onSelect: (id: ServiceId) => void
    isSelected?: boolean
}