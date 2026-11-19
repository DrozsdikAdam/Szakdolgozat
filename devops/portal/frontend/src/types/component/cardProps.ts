import type { ReactNode } from "react"

export interface CardProps {
    title?: string
    subtitle?: string
    action?: ReactNode
    children: ReactNode
    className?: string
    hoverEffect?: boolean
    onClick?: () => void
}