import type { ReactNode } from "react"

export interface StatCardProps {
    title: string
    value: string | number
    icon: ReactNode
    valueClassName?: string
    iconBoxClassName?: string
    className?: string
}
