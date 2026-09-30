export interface SecurityHeaderProps {
    lastScanDate?: string
    onRefresh?: () => void
    onOpenRotateModal: () => void
    isRefreshing?: boolean
}