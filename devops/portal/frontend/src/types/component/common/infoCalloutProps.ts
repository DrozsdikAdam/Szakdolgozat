import type { ReactNode } from "react"

export interface InfoCalloutProps {
    title: string
    children: ReactNode
    icon?: ReactNode
    variant?: 'info' | 'warning' | 'teal'
    className?: string
}
