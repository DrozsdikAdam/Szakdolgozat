import type { ReactNode } from "react"

export interface SegmentedControlOption<T extends string> {
    id: T
    label: string
    count?: number
    icon?: ReactNode
    variant?: 'teal' | 'orange' | 'vermillon' | 'skyblue' | 'purple'
}

export interface SegmentedControlProps<T extends string> {
    value: T
    onChange: (value: T) => void
    options: SegmentedControlOption<T>[]
    size?: 'sm' | 'md'
    layout?: 'pill' | 'grid'
    className?: string
}
