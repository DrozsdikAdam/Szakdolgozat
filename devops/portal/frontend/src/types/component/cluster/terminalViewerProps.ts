export interface TerminalViewerProps {
    lines: string[]
    loading?: boolean
    searchQuery?: string
    autoScroll?: boolean
    loadingText?: string
    emptyText?: string
    noMatchText?: string
    className?: string
}
