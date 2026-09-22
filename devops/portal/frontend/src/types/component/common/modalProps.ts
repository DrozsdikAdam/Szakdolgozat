import type { ReactNode } from "react"

export interface ModalProps {
    isOpen?: boolean
    onClose: () => void
    title: ReactNode
    subtitle?: ReactNode
    icon?: ReactNode
    headerExtra?: ReactNode
    children: ReactNode
    footer?: ReactNode
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl'
    className?: string
}
